import {ErrorHandler, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputDurationDirective} from './duration/input-duration.directive';
import {DurationFromStringPipe} from './duration/duration-from-string.pipe';
import {DurationToStringPipe} from './duration/duration-to-string.pipe';
import {EditOnClickDirective} from './edit-on-click/edit-on-click.directive';
import {InlineMarkdownComponent} from './inline-markdown/inline-markdown.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatNativeDateModule, MatOptionModule, MatRippleModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MarkdownModule, MarkdownService} from 'ngx-markdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FORMLY_CONFIG, FormlyModule} from '@ngx-formly/core';
import {ThemeSelectComponent} from './theme-select/theme-select.component';
import {MsToStringPipe} from './duration/ms-to-string.pipe';
import {StringToMsPipe} from './duration/string-to-ms.pipe';
import {ProgressBarComponent} from './progress-bar/progress-bar.component';
import {MsToStringPipe$} from './duration/ms-to-string$.pipe';
import {CollapsibleComponent} from './collapsible/collapsible.component';
import {HelpSectionComponent} from './help-section/help-section.component';
import {NumberToMonthPipe} from './pipes/number-to-month.pipe';
import {SplitModule} from '../pages/work-view/split/split.module';
import {SimpleDownloadDirective} from './simple-download/simple-download.directive';
import {Angular2PromiseButtonModule} from 'angular2-promise-buttons';
import {DialogConfirmComponent} from './dialog-confirm/dialog-confirm.component';
import {InputDurationFormlyComponent} from './duration/input-duration-formly/input-duration-formly.component';
import {EnlargeImgDirective} from './enlarge-img/enlarge-img.directive';
import {DragulaModule} from 'ng2-dragula';
import {MsToClockStringPipe} from './duration/ms-to-clock-string.pipe';
import {DatetimeInputComponent} from './datetime-input/datetime-input.component';
import {InputDurationSliderComponent} from './duration/input-duration-slider/input-duration-slider.component';
import {MsToMinuteClockStringPipe} from './duration/ms-to-minute-clock-string.pipe';
import {HumanizeTimestampPipe} from './pipes/humanize-timestamp.pipe';
import {KeysPipe} from './pipes/keys.pipe';
import {ToArrayPipe} from './pipes/to-array.pipe';
import {MomentFormatPipe} from './pipes/moment-format.pipe';
import {InlineInputComponent} from './inline-input/inline-input.component';
import {ChipListInputComponent} from './chip-list-input/chip-list-input.component';
import {ValidationModule} from './validation/validation.module';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {FullPageSpinnerComponent} from './full-page-spinner/full-page-spinner.component';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {FormlyMaterialModule} from '@ngx-formly/material';
import {GlobalErrorHandler} from '../core/error-handler/global-error-handler.class';
import {HAMMER_GESTURE_CONFIG} from '@angular/platform-browser';
import {MyHammerConfig} from '../../hammer-config.class';
import {registerTranslateExtension} from './formly-translate-extension/formly-translate-extension';
import {FormlyTranslatedTemplateComponent} from './formly-translated-template/formly-translated-template.component';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {FormlyValidationService} from './formly-translate-extension/formly-validation.service';


@NgModule({
  imports: [
    CommonModule,
    MarkdownModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forChild({
      types: [{
        name: 'duration',
        component: InputDurationFormlyComponent,
        extends: 'input',
        wrappers: ['form-field'],
      }, {
        name: 'tpl',
        component: FormlyTranslatedTemplateComponent,
      }],
      extras: {
        immutable: true
      },
    }),
    FormlyMaterialModule,

    Angular2PromiseButtonModule.forRoot({
      // handleCurrentBtnOnly: true,
    }),

    DragulaModule.forRoot(),

    // material2
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatOptionModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSelectModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatBadgeModule,
    MatMomentDateModule,
    ValidationModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    TranslateModule,
  ],
  declarations: [
    DurationFromStringPipe,
    DurationToStringPipe,
    InputDurationDirective,
    InputDurationFormlyComponent,
    InputDurationSliderComponent,
    EditOnClickDirective,
    InlineMarkdownComponent,
    ThemeSelectComponent,
    MsToClockStringPipe,
    MsToMinuteClockStringPipe,
    MsToStringPipe,
    MsToStringPipe$,
    StringToMsPipe,
    ProgressBarComponent,
    CollapsibleComponent,
    HelpSectionComponent,
    NumberToMonthPipe,
    SimpleDownloadDirective,
    DialogConfirmComponent,
    EnlargeImgDirective,
    DatetimeInputComponent,
    KeysPipe,
    ToArrayPipe,
    HumanizeTimestampPipe,
    MomentFormatPipe,
    InlineInputComponent,
    ChipListInputComponent,
    FullPageSpinnerComponent,
    FormlyTranslatedTemplateComponent,
  ],
  entryComponents: [
    DialogConfirmComponent,
  ],
  exports: [
    SplitModule,
    DurationFromStringPipe,
    DurationToStringPipe,
    InputDurationDirective,
    InputDurationFormlyComponent,
    InputDurationSliderComponent,
    EditOnClickDirective,
    InlineMarkdownComponent,
    ThemeSelectComponent,
    ProgressBarComponent,
    CollapsibleComponent,
    HelpSectionComponent,
    SimpleDownloadDirective,
    DialogConfirmComponent,
    EnlargeImgDirective,
    DatetimeInputComponent,
    InlineInputComponent,
    ChipListInputComponent,
    FullPageSpinnerComponent,

    MsToClockStringPipe,
    MsToMinuteClockStringPipe,
    MsToStringPipe,
    MsToStringPipe$,
    StringToMsPipe,
    NumberToMonthPipe,
    KeysPipe,
    ToArrayPipe,
    HumanizeTimestampPipe,
    MomentFormatPipe,

    DragulaModule,
    Angular2PromiseButtonModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,

    // material2
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatOptionModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSelectModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatBadgeModule,
    MatMomentDateModule,

    ReactiveFormsModule,
    FormlyModule,
    FormlyMaterialModule,
    MarkdownModule,
    ValidationModule,
    TranslateModule,
  ],
  providers: [
    {provide: ErrorHandler, useClass: GlobalErrorHandler},
    {provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig},
    {
      provide: FORMLY_CONFIG,
      multi: true,
      useFactory: registerTranslateExtension,
      deps: [TranslateService],
    },
  ],
})
export class UiModule {
  constructor(
    private _markdownService: MarkdownService,
    private _formlyValidationService: FormlyValidationService,
  ) {
    this._formlyValidationService.init();

    const linkRenderer = _markdownService.renderer.link;
    _markdownService.renderer.link = (href, title, text) => {
      const html = linkRenderer.call(_markdownService.renderer, href, title, text);
      return html.replace(/^<a /, '<a target="_blank" ');
    };

    _markdownService.renderer.paragraph = (text) => {
      const split = text.split('\n');
      return split.reduce((acc, p) => {
        const result = /h(\d)\./.exec(p);
        if (result) {
          const h = `h${result[1]}`;
          return acc + `<${h}>${p.replace(result[0], '')}</${h}>`;
        }
        return acc + `<p>${p}</p>`;
      }, '');
    };
  }
}
