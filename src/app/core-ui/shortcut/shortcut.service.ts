import {Injectable, NgZone} from '@angular/core';
import {IS_ELECTRON} from '../../app.constants';
import {checkKeyCombo} from '../../util/check-key-combo';
import {GlobalConfigService} from '../../features/config/global-config.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ElectronService} from 'ngx-electron';
import {LayoutService} from '../layout/layout.service';
import {NoteService} from '../../features/note/note.service';
import {TaskService} from '../../features/tasks/task.service';
import {MatDialog} from '@angular/material/dialog';
import {DialogAddNoteComponent} from '../../features/note/dialog-add-note/dialog-add-note.component';
import {BookmarkService} from '../../features/bookmark/bookmark.service';
import {AwesomeAddTaskPayload, IPC} from '../../../../electron/ipc-events.const';
import {PersistenceService} from '../../core/persistence/persistence.service';
import {take} from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  backlogPos: number;

  constructor(
    private _configService: GlobalConfigService,
    private _router: Router,
    private _electronService: ElectronService,
    private _layoutService: LayoutService,
    private _matDialog: MatDialog,
    private _noteService: NoteService,
    private _taskService: TaskService,
    private _activatedRoute: ActivatedRoute,
    private _bookmarkService: BookmarkService,
    private _persistenceService: PersistenceService,
    private _ngZone: NgZone,
  ) {
    this._activatedRoute.queryParams
      .subscribe((params) => {
        if (params && params.backlogPos) {
          this.backlogPos = +params.backlogPos;
        }
      });

    // GLOBAL SHORTCUTS
    if (IS_ELECTRON) {
      this._electronService.ipcRenderer.on(IPC.TASK_TOGGLE_START, () => {
        this._ngZone.run(() => {
          this._taskService.toggleStartTask();
        });
      });
      this._electronService.ipcRenderer.on(IPC.ADD_TASK, () => {
        this._ngZone.run(() => {
          this._layoutService.showAddTaskBar();
        });
      });
      this._electronService.ipcRenderer.on(IPC.ADD_NOTE, () => {
        if (this._matDialog.openDialogs.length === 0) {
          this._ngZone.run(() => {
            this._matDialog.open(DialogAddNoteComponent);
          });
        }
      });

      // TODO add desktop notifications
      this._electronService.ipcRenderer.on(IPC.AWE_ADD_TASK, (ev, param: AwesomeAddTaskPayload) => {
        this._ngZone.run(() => {
          // TODO add logic to add to another project
          if (param.projectId) {
          } else {
            this._taskService.add(param.title);
          }
        });
      });

      this._electronService.ipcRenderer.on(IPC.AWE_ADD_SUB_TASK, (ev, param: AwesomeAddTaskPayload) => {
        this._ngZone.run(() => {
          if (!this._taskService.currentTaskId) {
            return;
          }

          // TODO add logic to add to another project
          if (param.projectId) {
          } else {
            // TODO use new service method instead
            this._taskService.currentTaskOrCurrentParent$.pipe(take(1)).subscribe((task) => {
              console.log(task);
              this._taskService.addSubTaskTo(task.id, param.title);
            });
          }
        });
      });

      this._electronService.ipcRenderer.on(IPC.AWE_ADD_NOTE, (ev, param: AwesomeAddTaskPayload) => {
        this._ngZone.run(() => {
          // TODO add logic to add to another project
          if (param.projectId) {
          } else {
            this._noteService.add({content: param.title});
          }
        });
      });
    }
  }

  handleKeyDown(ev: KeyboardEvent) {
    const cfg = this._configService.cfg;
    const keys = cfg.keyboard;
    const el = ev.target as HTMLElement;

    // don't run when inside input or text area and if no special keys are used
    if ((el && el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable'))
      && !ev.ctrlKey && !ev.metaKey) {
      return;
    }

    // if (checkKeyCombo(ev, cfg.keyboard.openDistractionPanel)) {
    //   Dialogs('DISTRACTIONS', undefined, true);
    // }
    // if (checkKeyCombo(ev, cfg.keyboard.showHelp)) {
    //   Dialogs('HELP', {template: 'PAGE'}, true);
    // }
    //
    if (checkKeyCombo(ev, keys.toggleBacklog)) {
      let backlogPos = 0;
      switch (this.backlogPos) {
        case 50:
          backlogPos = 0;
          break;
        case 0:
          backlogPos = 100;
          break;
        default:
          backlogPos = 50;
      }
      this._router.navigate(['/work-view'], {
        queryParams: {backlogPos}
      });

    } else if (checkKeyCombo(ev, keys.goToWorkView)) {
      this._router.navigate(['/work-view']);

    } else if (checkKeyCombo(ev, keys.goToDailyAgenda)) {
      this._router.navigate(['/daily-agenda']);

    } else if (checkKeyCombo(ev, keys.goToSettings)) {
      this._router.navigate(['/settings']);

    } else if (checkKeyCombo(ev, keys.goToFocusMode)) {
      this._router.navigate(['/focus-view']);

    } else if (checkKeyCombo(ev, keys.focusLastActiveTask)) {
      this._router.navigate(['/work-view']);
      this._taskService.focusLastActiveTask();

    } else if (checkKeyCombo(ev, keys.addNewTask)) {
      this._layoutService.toggleAddTaskBar();
      ev.preventDefault();

    } else if (checkKeyCombo(ev, keys.addNewNote)) {
      if (this._matDialog.openDialogs.length === 0) {
        this._matDialog.open(DialogAddNoteComponent);
        ev.preventDefault();
      }

    } else if (checkKeyCombo(ev, keys.openProjectNotes)) {
      this._noteService.toggleShow();
      ev.preventDefault();

    } else if (checkKeyCombo(ev, keys.toggleBookmarks)) {
      this._bookmarkService.toggleBookmarks();
      ev.preventDefault();
    }

    // special hidden dev tools combo to use them for production
    if (IS_ELECTRON) {
      if (checkKeyCombo(ev, 'Ctrl+Shift+J')) {
        window.ipcRenderer.send('TOGGLE_DEV_TOOLS');
      } else if (checkKeyCombo(ev, keys.zoomIn)) {
        this._zoom(0.05);
      } else if (checkKeyCombo(ev, keys.zoomOut)) {
        this._zoom(-0.05);
      } else if (checkKeyCombo(ev, keys.zoomDefault)) {
        this._zoom(0);
      }
    }
  }

  private _zoom(zoomDelta: number) {
    const webFrame = this._electronService.webFrame;
    let zoomFactor = webFrame.getZoomFactor();
    zoomFactor += zoomDelta;
    zoomFactor = Math.min(Math.max(zoomFactor, 0.1), 4);

    if (zoomDelta === 0) {
      webFrame.setZoomFactor(1);
    } else {
      webFrame.setZoomFactor(zoomFactor);
    }
    this._configService.updateSection('_uiHelper', {
      _zoomFactor: zoomFactor
    });
  }
}
