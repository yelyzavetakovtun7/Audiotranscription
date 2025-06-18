import { isSegmentActive, formatTextWithHighlight, getFullTextWithHighlight } from './utils/highlightUtils';
import { saveSelection, restoreSelection } from './utils/cursorUtils';
import { TranscriptionTextEditor } from './components/TranscriptionTextEditor';

// Замість:
// {!showHistory && (
//   isEditing ? (
//     (() => { ... })()
//   ) : (
//     <TextEditor ... />
//   )
// )}
// Використовую:
{!showHistory && (
  <TranscriptionTextEditor
    editedSegments={editedSegments}
    currentTime={currentTime}
    isEditing={isEditing}
    onInput={handleEditorChange}
    editorRef={editorRef}
  />
)} 