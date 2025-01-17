import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Note} from '../note.model';
import {
  addNote,
  addNotes,
  clearNotes,
  deleteNote,
  deleteNotes,
  hideNotes,
  loadNoteState,
  toggleShowNotes,
  updateNote,
  updateNoteOrder,
  updateNotes,
  upsertNote,
  upsertNotes
} from './note.actions';
import {Action, createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';

export interface NoteState extends EntityState<Note> {
  // additional entities state properties
  isShowNotes: boolean;
}

export const adapter: EntityAdapter<Note> = createEntityAdapter<Note>();

export const initialNoteState: NoteState = adapter.getInitialState({
  // additional entity state properties
  isShowNotes: false,
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
export const NOTE_FEATURE_NAME = 'note';
export const selectNoteFeatureState = createFeatureSelector<NoteState>(NOTE_FEATURE_NAME);

export const selectAllNotes = createSelector(selectNoteFeatureState, selectAll);
export const selectIsShowNotes = createSelector(selectNoteFeatureState, (state) => state.isShowNotes);
export const selectNoteById = createSelector(
  selectNoteFeatureState,
  (state, props: { id: string }) => state.entities[props.id]
);

const _reducer = createReducer<NoteState>(
  initialNoteState,

  on(loadNoteState, (state, payload) => ({
    ...state,
    ...payload.state,
  })),

  on(toggleShowNotes, (state) => ({
    ...state,
    isShowNotes: !state.isShowNotes
  })),

  on(hideNotes, (state) => ({
    ...state,
    isShowNotes: false
  })),

  on(updateNoteOrder, (state, payload) => ({
    ...state,
    ids: payload.ids
  })),

  on(addNote, (state, payload) => ({
    ...state,
    entities: {
      ...state.entities,
      [payload.note.id]: payload.note
    },
    // add to top rather than bottom
    ids: [payload.note.id, ...state.ids] as string[] | number[]
  })),

  on(upsertNote, (state, {note}) => adapter.upsertOne(note, state)),

  on(addNotes, (state, {notes}) => adapter.addMany(notes, state)),

  on(upsertNotes, (state, {notes}) => adapter.upsertMany(notes, state)),

  on(updateNote, (state, {note}) => adapter.updateOne(note, state)),

  on(updateNotes, (state, {notes}) => adapter.updateMany(notes, state)),

  on(deleteNote, (state, {id}) => adapter.removeOne(id, state)),

  on(deleteNotes, (state, {ids}) => adapter.removeMany(ids, state)),

  on(clearNotes, (state) => adapter.removeAll(state)),
);

export function noteReducer(
  state = initialNoteState,
  action: Action
): NoteState {
  return _reducer(state, action);
}


