import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {msToString} from '../../../ui/duration/ms-to-string.pipe';
import {TaskWithSubTasks} from '../../tasks/task.model';
import {ProjectService} from '../../project/project.service';
import {Subscription} from 'rxjs';
import {SimpleSummarySettingsCopy} from '../../project/project.model';
import {SIMPLE_SUMMARY_DEFAULTS} from '../../project/project.const';
import Clipboard from 'clipboard';
import {SnackService} from '../../../core/snack/snack.service';
import {getWorklogStr} from '../../../util/get-work-log-str';
import * as moment from 'moment';
import 'moment-duration-format';
import {roundDuration} from '../../../util/round-duration';
import {T} from '../../../t.const';
import {TranslateService} from '@ngx-translate/core';

const LINE_SEPARATOR = '\n';

@Component({
  selector: 'simple-task-export',
  templateUrl: './simple-task-export.component.html',
  styleUrls: ['./simple-task-export.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleTaskExportComponent implements OnInit, OnDestroy {
  @Input() tasks: any[];

  @Output() cancel = new EventEmitter();

  T = T;
  options: SimpleSummarySettingsCopy = SIMPLE_SUMMARY_DEFAULTS;
  tasksTxt: string;
  tasksHtml: string;
  fileName = 'tasks.csv';
  roundTimeOptions = [
    {id: 'QUARTER', title: T.F.SIMPLE_TASK_EXPORT.R.QUARTER},
    {id: 'HALF', title: T.F.SIMPLE_TASK_EXPORT.R.HALF},
    {id: 'HOUR', title: T.F.SIMPLE_TASK_EXPORT.R.HOUR},
  ];

  private _subs: Subscription = new Subscription();

  constructor(
    private _projectService: ProjectService,
    private _snackService: SnackService,
    private _translateService: TranslateService,
  ) {
  }

  ngOnInit() {
    this._subs.add(this._projectService.advancedCfg$.subscribe((val) => {
      this.options = {...val.simpleSummarySettings};

      if (this.tasks) {
        this.tasksTxt = this._createTasksText(this.tasks);
        this.tasksHtml = this._parseToTable(this.tasksTxt);
      }
    }));

    // dirty but good enough for now
    const clipboard = new Clipboard('#clipboard-btn');
    clipboard.on('success', (e: any) => {
      this._snackService.open({
        msg: T.GLOBAL_SNACK.COPY_TO_CLIPPBOARD,
        type: 'SUCCESS'
      });
      e.clearSelection();
    });
  }

  ngOnDestroy() {
    this._subs.unsubscribe();
  }

  onCancelClick() {
    this.cancel.emit();
  }

  onOptionsChange() {
    this._projectService.updateSimpleSummarySettings(this._projectService.currentId, this.options);
  }

  private _formatTask(task) {
    let taskTxt = '';
    if (this.options.isShowDate) {
      taskTxt += task.dateStr || getWorklogStr();
    }

    if (this.options.isShowTimeSpent) {
      taskTxt = this._addSeparator(taskTxt);
      let timeSpent = task.timeSpent;
      if (this.options.roundWorkTimeTo) {
        const val = moment.duration(task.timeSpent);
        timeSpent = roundDuration(val, this.options.roundWorkTimeTo, true).asMilliseconds();
      }

      taskTxt += this.options.isTimesAsMilliseconds
        ? timeSpent
        : msToString(timeSpent, false, true);
    }

    if (this.options.isShowTimeEstimate) {
      taskTxt = this._addSeparator(taskTxt);

      taskTxt += this.options.isTimesAsMilliseconds
        ? task.timeEstimate
        : msToString(task.timeEstimate, false, true);
    }

    if (this.options.isShowTitle) {
      taskTxt = this._addSeparator(taskTxt);
      taskTxt += task.title;
    }

    return taskTxt;
  }

  private _addSeparator(taskTxt) {
    if (taskTxt.length > 0) {
      taskTxt += (this.options.separateFieldsBy || SIMPLE_SUMMARY_DEFAULTS.separateFieldsBy);
    }
    return taskTxt;
  }

  private _createTasksText(tasks: TaskWithSubTasks[]) {
    let tasksTxt = '';

    if (tasks) {
      // tslint:disable-next-line
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (
          (!this.options.isListDoneOnly || task.isDone)
          && (!this.options.isWorkedOnTodayOnly || this._checkIsWorkedOnToday(task))
        ) {
          tasksTxt += this._formatTask(task);
          tasksTxt += LINE_SEPARATOR;
        }

        if (this.options.isListSubTasks && task.subTasks && task.subTasks.length > 0) {
          // tslint:disable-next-line
          for (let j = 0; j < task.subTasks.length; j++) {
            const subTask = task.subTasks[j];
            if (
              (!this.options.isListDoneOnly || subTask.isDone)
              && (!this.options.isWorkedOnTodayOnly || this._checkIsWorkedOnToday(subTask))) {
              tasksTxt += this._formatTask(subTask);
              tasksTxt += LINE_SEPARATOR;
            }
          }
        }
      }
    }

    // remove last new line
    tasksTxt = tasksTxt.substring(0, tasksTxt.length - LINE_SEPARATOR.length);

    return tasksTxt;
  }

  private _checkIsWorkedOnToday(task) {
    const dateStr = getWorklogStr();
    return !!task.timeSpentOnDay[dateStr];
  }

  private _parseToTable(tasksTxt) {
    let rowsHtml = '';
    const rows = tasksTxt.split(LINE_SEPARATOR).filter(row => row.length);

    rows.forEach(row => {
      const cols = row.split((this.options.separateFieldsBy || SIMPLE_SUMMARY_DEFAULTS.separateFieldsBy));
      rowsHtml += `<tr><td>${cols.join('</td><td>')}</td></tr>`;
    });

    const headerCols = [];
    if (this.options.isShowDate) {
      headerCols.push(this._translateService.instant(T.F.SIMPLE_TASK_EXPORT.DATE));
    }
    if (this.options.isShowTimeSpent) {
      headerCols.push(this._translateService.instant(T.F.SIMPLE_TASK_EXPORT.TIME_SPENT));
    }
    if (this.options.isShowTimeEstimate) {
      headerCols.push(this._translateService.instant(T.F.SIMPLE_TASK_EXPORT.ESTIMATE));
    }
    if (this.options.isShowTitle) {
      headerCols.push(this._translateService.instant(T.F.SIMPLE_TASK_EXPORT.TITLE));
    }
    const headerColsHtml = `<tr><th>${headerCols.join('</th><th>')}</th></tr>`;
    if (!rows.length) {
      const noDataStr = this._translateService.instant(T.F.SIMPLE_TASK_EXPORT.NO_DATA);
      rowsHtml += `<tr><td>${Array(headerCols.length).fill(noDataStr).join('</td><td>')}</td></tr>`;
    }

    return `<table>${headerColsHtml}${rowsHtml}</table>`;
  }
}
