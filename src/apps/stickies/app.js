// story: e03s02, e03s03


let easyMartina = false;

window.onerror = function (message, _file, _line, _col, e) {
  if (!easyMartina) alert(`Error occurred: ${e && e.message ? e.message : message}`);
  return false;
};

window.addEventListener('error', (e) => {
  if (!easyMartina) alert(`Error occurred: ${e && e.error && e.error.message ? e.error.message : 'Unknown error'}`);
  return false;
});

/*
	 *	notes / lists / boards
	 */
const $tNote = $('#templates .note');
const $tList = $('#templates .list');
// The board is built as a MF.Window at runtime (showBoard); no board template.

function addNote($list, $after, $before, color) {
  let $note = $tNote.clone();
  const $notes = $list.find('.notes');

  $note.find('.text').html('');
  $note.addClass('brand-new');

  // Set color (default to gray if not provided)
  color = color || 'gray';
  $note.addClass(`note-${color}`);

  if ($before && $before.length) {
    $before.before($note);
    $note = $before.prev();
  } else
    if ($after && $after.length) {
      $after.after($note);
      $note = $after.next();
    } else {
      $notes.append($note);
      $note = $notes.find('.note').last();
    }

  $note.find('.text')[0].click();
}

function deleteNote($note) {
  $note.remove();
  saveBoard();
}

function noteLocation($item) {
  let loc = 0;
  for (let $p = $item.closest('.note'); $p.length; $p = $p.prev(), loc += 1);
  for (let $p = $item.closest('.list'); $p.length; $p = $p.prev(), loc += 10000);
  return loc;
}

//
function addList() {
  const $board = $('.wrap .board');
  const $lists = $board.find('.lists');
  const $list = $tList.clone();

  $list.find('.text').html('');
  $list.find('.head').addClass('brand-new');

  $lists.append($list);
  const $lastText = $board.find('.lists .list .head .text').last();
  if ($lastText.length) $lastText[0].click();

  const lists = $lists[0];
  lists.scrollLeft = Math.max(0, lists.scrollWidth - lists.clientWidth);

  setupListScrolling();
}

function deleteList($list) {
  let empty = true;

  $list.find('.note .text').each(function () {
    empty &= ($(this).html().length === 0);
  });

  if (!empty && !confirm('Delete this list and all its notes?')) return;

  $list.remove();
  saveBoard();

  setupListScrolling();
}

function moveList($list, left) {
  const $a = $list;
  const $b = left ? $a.prev() : $a.next();

  const _$menuA = $a.children('.head').find('.menu .bulk');
  const _$menuB = $b.children('.head').find('.menu .bulk');

  const _pos_a = $a.offset().left;
  const _pos_b = $b.offset().left;

  // Swap lists immediately
  if (left) $list.prev().before($list);
  else $list.before($list.next());

  saveBoard();
}

//
function openBoard(boardId) {
  closeBoard(true);

  SKB.board = SKB.storage.loadBoard(boardId, null);
  SKB.storage.setActiveBoard(boardId);

  showBoard(true);
}

function reopenBoard(revision) {
  const boardId = SKB.board.id;

  SKB.storage.setBoardRevision(boardId, revision);

  openBoard(boardId);
}

function closeBoard(_quick) {
  if (!SKB.board) return;

  const $board = $('.wrap .board');

  $board.remove();

  // Release the window from the manager registry (el already removed above).
  if (SKB.boardWindow) {
    MF.WindowManager.remove(SKB.boardWindow);
    SKB.boardWindow = null;
  }

  SKB.board = null;
  SKB.storage.setActiveBoard(null);

  updatePageTitle();
}

//
function createBoard(title) {
  SKB.board = new Board(title || 'Untitled Board');

  // Add default lists
  const firstList = SKB.board.addList('Ideas/Someday');
  firstList.addNote('Start ideas here.');
  SKB.board.addList('Doing');
  SKB.board.addList('Done');

  // Save the board immediately so it persists on reload
  SKB.storage.saveBoard(SKB.board);
  SKB.storage.setActiveBoard(SKB.board.id);

  return SKB.board;
}

function saveBoard() {
  const $board = $('.wrap .board');
  const board = Object.assign(new Board(), SKB.board); // id, revision & title

  board.lists = [];

  $board.find('.list').each(function () {
    const $list = $(this);
    const l = board.addList(getText($list.find('.head .text')));

    $list.find('.note').each(function () {
      const $note = $(this);
      const text = getText($note.find('.text'));

      // Extract color from note class
      let color = 'gray';
      const colorClass = $note.attr('class').match(/\bnote-(yellow|blue|green|pink|purple|gray)\b/);
      if (colorClass) {
        color = colorClass[1];
      }

      const _n = l.addNote(text, color);
    });
  });

  SKB.storage.saveBoard(board);
  SKB.board = board;

  updateUndoRedo();
}

function deleteBoard() {
  const boardId = SKB.board && SKB.board.id;

  closeBoard();

  if (boardId) SKB.storage.nukeBoard(boardId);

  // Single-board app: replace the board with a fresh empty one
  createBoard('Untitled Board');
  showBoard(true);

  $('.wrap .board .head').addClass('brand-new');
  $('.wrap .board .head .text')[0].click();
}

//
function undoBoard() {
  if (!SKB.board) return false;

  const hist = SKB.storage.getBoardHistory(SKB.board.id);
  const have = SKB.board.revision;
  let want = 0;

  for (let i = 0; i < hist.length - 1 && !want; i += 1) if (have === hist[i]) want = hist[i + 1];

  if (!want) {
    return false;
  }

  reopenBoard(want);
  return true;
}

function redoBoard() {
  if (!SKB.board) return false;

  const hist = SKB.storage.getBoardHistory(SKB.board.id);
  const have = SKB.board.revision;
  let want = 0;

  for (let i = 1; i < hist.length && !want; i += 1) if (have === hist[i]) want = hist[i - 1];

  if (!want) {
    return false;
  }

  reopenBoard(want);
  return true;
}

//
function showBoard(quick) {
  const { board } = SKB;

  const $wrap = $('.wrap');

  // The board is a MF.Window: the titlebar holds the editable board title, and
  // the window content holds the lists.
  const $title = $('<span class="title"><span class="text board-title-display"></span></span>');
  const $edit = $('<input class="edit" spellcheck="false" placeholder="Name of the board">');
  const win = new MF.Window({
    titleEl: [$title[0], $edit[0]],
    buttons: false,
  });
  win.el.classList.add('board');
  win.el.boardId = board.id;
  SKB.boardWindow = win;
  setText($title.find('.text'), board.title);

  const $content = $(win.contentEl);
  $content.append('<div class="lists-scroller"><div></div></div>');
  const $bLists = $('<div class="lists"></div>');
  $content.append($bLists);

  // Ensure lists array exists
  if (!board.lists) {
    board.lists = [];
  }

  board.lists.forEach((list) => {
    const $l = $tList.clone();
    const $lNotes = $l.find('.notes');

    setText($l.find('.head .text'), list.title);

    list.notes.forEach((n) => {
      const $n = $tNote.clone();
      setText($n.find('.text'), n.text);
      // Apply note color
      const color = n.color || 'gray';
      $n.addClass(`note-${color}`);
      $lNotes.append($n);
    });

    $bLists.append($l);
  });

  if (quick) $wrap.html('').append(win.el);
  else $wrap.html('').append(win.el).css({ opacity: 1 });

  // Reset scroll to top when showing board
  window.scrollTo(0, 0);

  updatePageTitle();
  updateUndoRedo();
  setupListScrolling();
}

/*
	 *	demo board
	 */
function createDemoBoard() {
  // Create board with welcome title
  SKB.board = new Board('Welcome to Stickies Kanban Board');

  // Add default lists
  const firstList = SKB.board.addList('Ideas/Someday');
  firstList.addNote('Awesome running 200% Zoom and Fullscreen', 'green');
  firstList.addNote('Board titles and list titles can be changed by clicking on them.', 'gray');
  firstList.addNote('Control-Enter while editing to make a new note below', 'pink');
  firstList.addNote('Organize by:\n• Dragging & Dropping notes\n• Changing colors\n• Control-Shift-8 for bullets', 'gray');
  SKB.board.addList('Doing');
  const doneList = SKB.board.addList('Done');
  doneList.addNote('Ephemeral Process, here. Thinking not twiddling.', 'yellow');

  // Save the board immediately so it persists on reload
  SKB.storage.saveBoard(SKB.board);
  SKB.storage.setActiveBoard(SKB.board.id);

  return SKB.board;
}

/*
	 *	select note in welcome board
	 */
function selectWelcomeBoardNote() {
  const $lastList = $('.board .list').last();
  const $lastNote = $lastList.find('.note').last();
  if ($lastNote.length) {
    $('.board .note').removeClass('selected');
    $lastNote.addClass('selected');
    SKB.selectedNote = $lastNote[0];
    MF.menubar.setMenuEnabled('color', true);
  }
}

/*
	 *
	 */
function updatePageTitle() {
  let title = 'Stickies Board';

  if (SKB.board) {
    title = SKB.board.title;
    title = `SKB - ${title || '(untitled board)'}`;
  }

  document.title = title;
}

function updateUndoRedo() {
  let undo = false;
  let redo = false;

  if (SKB.board && SKB.board.revision) {
    const history = SKB.storage.getBoardHistory(SKB.board.id);
    const rev = SKB.board.revision;

    undo = (rev !== history[history.length - 1]);
    redo = (rev !== history[0]);
  }

  MF.menubar.setItemEnabled('undo-board', undo);
  MF.menubar.setItemEnabled('redo-board', redo);
}

/*
	 *	generic utils
	 */
function htmlEncode(raw) {
  // Use vanilla JS instead of jQuery hack
  const div = document.createElement('div');
  div.textContent = raw;
  return div.innerHTML;
}

function setText($note, text) {
  $note.attr('_text', text);

  text = htmlEncode(text);

  const hmmm = /\b(https?:\/\/[^\s]+)/mg;
  text = text.replace(hmmm, (url) => `<a href="${url}" target=_blank>${url}</a>`);

  if (SKB.peek('fileLinks')) {
    const xmmm = /`(.*?)`/mg;
    text = text.replace(xmmm, (full, text) => {
      const link = `file:///${text.replace('\\', '/')}`;
      return `\`<a href="${link}" target=_blank>${text}</a>\``;
    });
  }

  $note.html(text); // ? text : ' ');
}

function getText($note) {
  return $note.attr('_text');
}

function removeTextSelection() {
  if (window.getSelection) { window.getSelection().removeAllRanges(); } else if (document.selection) { document.selection.empty(); }
}

// Export for use in drag.js
window.removeTextSelection = removeTextSelection;

/*
	 *	inline editing
	 */
function startEditing($text, _ev) {
  const $note = $text.parent();
  const $edit = $note.find('.edit');

  $edit.val(getText($text));
  $edit.width($text.width());

  $edit.height($text.height());
  $note.addClass('editing');

  if ($edit.length) $edit[0].focus();
}

function stopEditing($edit, viaEscape, viaXclick) {
  const $item = $edit.parent();
  if (!$item.hasClass('editing')) return;

  $item.removeClass('editing');

  //
  const $text = $item.find('.text');
  const textNow = $edit.val().trimRight();
  const textWas = getText($text);

  //
  const brandNew = $item.hasClass('brand-new');
  $item.removeClass('brand-new');

  if (viaEscape) {
    if (brandNew) $item.closest('.note, .list, .board').remove();
    return;
  }

  if (viaXclick && brandNew && !textNow.length) {
    $item.closest('.note, .list, .board').remove();
    return;
  }

  if (textNow !== textWas || brandNew) {
    setText($text, textNow);

    if ($item.parent().hasClass('board')) SKB.board.title = textNow;

    updatePageTitle();
    saveBoard();
  }

  //
  if (brandNew && $item.hasClass('list')) addNote($item);
}

function handleTab(ev) {
  const $this = $(this);
  const $note = $this.closest('.note');
  const $sibl = ev.shiftKey ? $note.prev() : $note.next();

  if ($sibl.length) {
    stopEditing($this, false, false);
    if ($sibl.length) $sibl.find('.text')[0].click();
  }
}

// setRevealState removed - Ctrl/CapsLock reveal functionality disabled

/*
	 *	adjust this and that
	 */
function adjustLayout() {
  const $body = $('body');
  const $board = $('.board');

  if (!$board.length) return;

  const listW = 240;

  const lists = $board.find('.list').length;
  const listsW = (lists < 2) ? listW : (listW + 10) * lists - 10;
  const bodyW = $body.width();

  if (listsW + 190 <= bodyW) {
    $board.css('max-width', '');
    $body.removeClass('crowded');
  } else {
    let max = Math.floor((bodyW - 40) / (listW + 10));
    max = (max < 2) ? listW : (listW + 10) * max - 10;
    $board.css('max-width', `${max}px`);
    $body.addClass('crowded');
  }
}

//
function adjustListScroller() {
  const $board = $('.board');
  if (!$board.length) return;

  const $lists = $('.board .lists');
  const $scroller = $('.board .lists-scroller');
  const $inner = $scroller.find('div');

  const max = $board.width();
  const want = $lists[0].scrollWidth;
  const have = $inner.outerWidth();

  if (want <= max + 5) {
    $scroller.hide();
    return;
  }

  $scroller.show();
  if (want === have) return;

  $inner.width(want);
  cloneScrollPos($lists, $scroller);
}

function cloneScrollPos($src, $dst) {
  const src = $src[0];
  const dst = $dst[0];

  if (src._busyScrolling) {
    src._busyScrolling--;
    return;
  }

  dst._busyScrolling++;
  dst.scrollLeft = src.scrollLeft;
}

function setupListScrolling() {
  const $lists = $('.board .lists');
  const $scroller = $('.board .lists-scroller');

  adjustListScroller();

  $lists[0]._busyScrolling = 0;
  $scroller[0]._busyScrolling = 0;

  $scroller.on('scroll', () => { cloneScrollPos($scroller, $lists); });
  $lists.on('scroll', () => { cloneScrollPos($lists, $scroller); });

  adjustLayout();
}

/*
	 *	dragsters
	 */
function initDragAndDrop() {
  SKB.noteDrag = new Drag2();
  SKB.noteDrag.listSel = '.board .list .notes';
  SKB.noteDrag.itemSel = '.note';
  SKB.noteDrag.dragster = 'note-dragster';
  SKB.noteDrag.onDragging = function (started) {
    const drag = this;
    const $note = $(drag.item);

    if (started) {
      const { $drag } = drag;

      $drag.html('<div class=titlebar></div><a href=# class=note-icon></a><div class=text></div>');
      $drag.find('.text').html($note.find('.text').html());

      // Copy color class from note to dragster
      const colorClass = $note.attr('class').match(/\bnote-(yellow|blue|green|pink|purple|gray)\b/);
      if (colorClass) {
        $drag.addClass(colorClass[0]);
      }

      drag.org_loc = noteLocation($note);
    } else if (this.org_loc !== noteLocation($note)) saveBoard();
  };
}

/*
   *  Initialize SKB object
   */
const SKB = {
  codeVersion: "2025.Dec.11",
  blobVersion: "2025.Dec.11", // board blob format in Storage
  board: null,
  storage: null,
  selectedNote: null,

  peek(name) {
    return this.storage.getConfig()[name];
  },

  poke(name, val) {
    const conf = this.storage.getConfig();
    conf[name] = val;
    return this.storage.saveConfig();
  },
};

/*
	 *	event handlers
	 */
// Window blur handler removed - reveal functionality disabled

// Global hotkeys removed

$('.wrap').on('click', '.board .text', function (ev) {
  if (this.was_dragged) {
    this.was_dragged = false;
    return false;
  }

  SKB.noteDrag.cancelPriming();

  // Select this note and enable color menu
  const $note = $(this).closest('.note');
  $('.board .note').removeClass('selected');
  $note.addClass('selected');
  SKB.selectedNote = $note[0];
  MF.menubar.setMenuEnabled('color', true);

  startEditing($(this), ev);
  return false;
});

// Special handler for board title in window titlebar
$('.wrap').on('click', '.board .window-title.head .text', function (_ev) {
  const $head = $(this).closest('.window-title.head');
  const $edit = $head.find('.edit');
  const $text = $(this);
  const $titleSpan = $head.find('span.title');

  $edit.val(getText($text));

  // Match the width of the gray title area (span.title)
  // span.title has padding: 0 7px (14px total)
  // edit input has padding: 2px 7px (14px) + border: 1px (2px) = 16px total
  // .width() sets content width, so subtract edit padding+border from span outerWidth
  const titleWidth = $titleSpan.outerWidth() - 16;
  $edit.width(titleWidth);

  $head.addClass('editing');

  if ($edit.length) $edit[0].focus();

  return false;
});

// Board title edit keydown handler
$('.wrap').on('keydown', '.board .window-title.head .edit', function (ev) {
  const $this = $(this);
  const $head = $this.closest('.window-title.head');

  // Enter or Escape to finish editing
  if (ev.keyCode === 13 || ev.keyCode === 27) {
    const $text = $head.find('.text');
    const textNow = $this.val().trimRight();

    if (ev.keyCode === 13 && textNow) {
      setText($text, textNow);
      if (SKB.board) SKB.board.title = textNow;
      saveBoard();
    }

    $head.removeClass('editing');
    return false;
  }
});

// Board title edit blur handler
$('.wrap').on('blur', '.board .window-title.head .edit', function (_ev) {
  const $this = $(this);
  const $head = $this.closest('.window-title.head');
  const $text = $head.find('.text');
  const textNow = $this.val().trimRight();

  if (textNow) {
    setText($text, textNow);
    if (SKB.board) SKB.board.title = textNow;
    saveBoard();
  }

  $head.removeClass('editing');
});

// Board title edit input handler - resize as typing
$('.wrap').on('input', '.board .window-title.head .edit', function () {
  const $this = $(this);
  const $head = $this.closest('.window-title.head');

  // Calculate what span.title width would be with this text
  // span.title has padding: 0 7px
  const tempSpan = $('<span>').css({
    'font-size': '10px',
    'font-family': $this.css('font-family'),
    'font-weight': 'bold',
    padding: '0 7px',
    visibility: 'hidden',
    position: 'absolute',
    'white-space': 'nowrap',
  }).text($this.val() || 'A').appendTo('body');

  // Get the outerWidth (includes padding) and subtract edit input's padding+border
  const titleOuterWidth = tempSpan.outerWidth();
  tempSpan.remove();

  const contentWidth = titleOuterWidth - 16; // Subtract edit input's padding (14px) + border (2px)
  const maxWidth = $head.width() - 100; // Leave room for buttons

  $this.width(Math.max(100, Math.min(contentWidth, maxWidth)));
});

//
$('.wrap').on('keydown', '.board .edit', function (ev) {
  const $this = $(this);
  let $note = $this.closest('.note');
  const $list = $this.closest('.list');

  const isNote = $note.length > 0;
  const isList = $list.length > 0;

  // esc
  if (ev.keyCode === 27) {
    stopEditing($this, true, false);
    return false;
  }

  // tab
  if (ev.keyCode === 9) {
    handleTab.call(this, ev);
    return false;
  }

  // done
  if (ev.keyCode === 13 && ev.altKey
    || ev.keyCode === 13 && ev.shiftKey && !ev.ctrlKey) {
    stopEditing($this, false, false);
    return false;
  }

  // done + add after
  if (ev.keyCode === 13 && ev.ctrlKey) {
    stopEditing($this, false, false);

    if (isNote) {
      // Get the color of the current note
      let currentColor = 'gray';
      const colorMatch = $note.attr('class').match(/\bnote-(yellow|blue|green|pink|purple|gray)\b/);
      if (colorMatch) {
        currentColor = colorMatch[1];
      }
      addNote($list, $note, null, currentColor);
    } else
      if (isList) {
        $note = $list.find('.note').last();
        addNote($list, $note);
      } else {
        addList();
      }

    return false;
  }

  // done on Enter if editing board or list title
  if (ev.keyCode === 13 && !isNote) {
    stopEditing($this, false, false);
    return false;
  }

  // Alt + Arrow and Alt + R hotkeys removed

  // ctrl-shift-8
  if (isNote && ev.key === '*' && ev.ctrlKey) {
    const have = this.value;
    const pos = this.selectionStart;
    const want = `${have.substr(0, pos)}\u2022 ${have.substr(this.selectionEnd)}`;
    $this.val(want);
    this.selectionStart = this.selectionEnd = pos + 2;
    return false;
  }

  return true;
});

$('.wrap').on('keypress', '.board .edit', function (ev) {
  // tab
  if (ev.keyCode === 9) {
    handleTab.call(this, ev);
    return false;
  }
});

//
$('.wrap').on('blur', '.board .edit', function (_ev) {
  if (document.activeElement !== this) stopEditing($(this), false, true);
  else ; // switch away from the browser window
});

//
$('.wrap').on('input propertychange', '.board .note .edit', function () {
  const delta = $(this).outerHeight() - $(this).height();

  $(this).height(10);

  if (this.scrollHeight > this.clientHeight) $(this).height(this.scrollHeight - delta);
});

//
// Menubar — rendered by core/menubar from a config; actions route via registry.
//
const menuConfig = {
  appTitle: 'Stickies Kanban Board',
  icon: '../../core/menubar/assets/icon-apple.png',
  clock: true,
  menus: [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Note on first list', action: 'add-note-first' },
        { divider: true },
        { label: 'Reset Board…', action: 'delete-board', warn: true },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', action: 'undo-board' },
        { label: 'Redo', action: 'redo-board' },
        { divider: true },
        { label: 'Add List', action: 'add-list' },
      ],
    },
    {
      id: 'color',
      label: 'Color',
      color: true,
      items: [
        { label: 'Yellow', action: 'set-color', value: 'yellow' },
        { label: 'Blue', action: 'set-color', value: 'blue' },
        { label: 'Green', action: 'set-color', value: 'green' },
        { label: 'Pink', action: 'set-color', value: 'pink' },
        { label: 'Purple', action: 'set-color', value: 'purple' },
        { label: 'Gray', action: 'set-color', value: 'gray' },
      ],
    },
  ],
};

function noteCurrentColor($note) {
  let currentColor = 'gray';
  const classes = $note.attr('class').split(' ');
  for (let i = 0; i < classes.length; i += 1) {
    if (classes[i].match(/^note-/)) {
      currentColor = classes[i].replace('note-', '');
      break;
    }
  }
  return currentColor;
}

MF.menubar.on('action', ({ action, element }) => {
  if (action === 'add-note-first') {
    const $fl = $('.wrap .board .lists .list').first();
    if ($fl.length) addNote($fl);
    return;
  }
  if (action === 'delete-board') { deleteBoard(); return; }
  if (action === 'undo-board') { undoBoard(); return; }
  if (action === 'redo-board') { redoBoard(); return; }
  if (action === 'add-list') { addList(); return; }
  if (action === 'set-color') {
    if (!SKB.selectedNote) return;
    const color = element.dataset.color;
    const $note = $(SKB.selectedNote);
    if (!$note.length) return;
    $note.removeClass('note-yellow note-blue note-green note-pink note-purple note-gray');
    $note.addClass(`note-${color}`);
    const listIndex = $note.closest('.list').index();
    const noteIndex = $note.index();
    if (SKB.board.lists[listIndex] && SKB.board.lists[listIndex].notes[noteIndex]) {
      SKB.board.lists[listIndex].notes[noteIndex].color = color;
      saveBoard();
    }
  }
});

// Keep the Color menu's checkmark on the selected note's color when opened.
MF.menubar.on('color-open', () => {
  if (SKB.selectedNote) {
    MF.menubar.setActiveColor(noteCurrentColor($(SKB.selectedNote)));
  } else {
    MF.menubar.setActiveColor(null);
  }
});

$('.wrap').on('click', '.board .del-list', function () {
  deleteList($(this).closest('.list'));
  return false;
});

$('.wrap').on('click', '.board .mov-list-l', function () {
  moveList($(this).closest('.list'), true);
  return false;
});

$('.wrap').on('click', '.board .mov-list-r', function () {
  moveList($(this).closest('.list'), false);
  return false;
});

//
$('.wrap').on('click', '.board .add-note', function () {
  addNote($(this).closest('.list'));
  return false;
});

$('.wrap').on('click', '.board .note-icon', function () {
  deleteNote($(this).closest('.note'));
  return false;
});

//
// Note selection management
//

// Select note when clicking on it (not on text)
$('.wrap').on('click', '.board .note', function (ev) {
  // Don't select if clicking on text (text handler will manage)
  if ($(ev.target).closest('.text').length) return;

  // Deselect all notes
  $('.board .note').removeClass('selected');

  // Select this note
  $(this).addClass('selected');
  SKB.selectedNote = this;

  // Enable color menu
  MF.menubar.setMenuEnabled('color', true);

  return false;
});

// Deselect when clicking outside notes (but not on header/menus)
$('.wrap').on('click', (ev) => {
  if (!$(ev.target).closest('.note').length && !$(ev.target).closest('header').length) {
    $('.board .note').removeClass('selected');
    SKB.selectedNote = null;

    // Disable color menu
    MF.menubar.setMenuEnabled('color', false);
  }
});

// Raw note toggle removed
// Collapse toggle removed

//
// Drag from anywhere when NOT editing
$('.wrap').on('mousedown', '.board .note:not(.editing) .text', function (ev) {
  ev.preventDefault();
  SKB.noteDrag.prime(this.parentNode, ev);
});

// Drag from titlebar only when editing
$('.wrap').on('mousedown', '.board .note.editing .titlebar', function (ev) {
  ev.preventDefault();
  SKB.noteDrag.prime(this.parentNode, ev);
});

//
$(document).on('mouseup', (_ev) => {
  if (SKB.noteDrag) SKB.noteDrag.end();
  if (SKB.varAdjust) SKB.varAdjust.end();
});

$(document).on('mousemove', (ev) => {
  if (SKB.noteDrag) SKB.noteDrag.onMouseMove(ev);
  if (SKB.varAdjust) SKB.varAdjust.onMouseMove(ev);
});

/***/

$(window).on('resize', adjustLayout);

$('body').on('dragstart', () => false);

/*
	 *	the init()
	 */
SKB.storage = new StorageLocal();

if (!SKB.storage.open()) {
  easyMartina = true;
  throw new Error();
}

//
const conf = SKB.storage.getConfig();

/*
	 *	the ui
	 */
initDragAndDrop();

// Register app sounds with the shared core sound module (drag-drop pop).
MF.sound.register('pop', '../../core/sound/assets/sound-pop.wav');

// Render the menubar from the declarative config (core/menubar).
MF.menubar.render(menuConfig);

SKB.varAdjust = new VarAdjust();

// Generate PWA manifest dynamically
(function() {
  const favicon32 = document.querySelector('link[rel="icon"][sizes="32x32"]').href;
  const manifest = {
    name: "Stickies Kanban Board",
    short_name: "Stickies KB",
    description: "Fantasy Retro Mac Kanban Application",
    version: "2025.Dec.11",
    start_url: ".",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: favicon32,
        sizes: "32x32",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
  document.getElementById('pwa-manifest').href =
    'data:application/json,' + encodeURIComponent(JSON.stringify(manifest));
})();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Load the single board (configured, else first existing, else welcome board)
let _boardId = conf.board;
if (!_boardId || !SKB.storage.getBoardIndex().has(_boardId)) {
  const _ids = [...SKB.storage.getBoardIndex().keys()];
  _boardId = _ids.length ? _ids[0] : null;
}
if (_boardId) openBoard(_boardId);

adjustLayout();

SKB.storage.setVerLast();

//
if (!SKB.board) SKB.board = createDemoBoard();

if (SKB.board) {
  showBoard(true);

  // Select last note in last column if this is the welcome board
  if (SKB.board.title === 'Welcome to Stickies Kanban Board') {
    selectWelcomeBoardNote();
  } else {
    // Initialize color menu as disabled (will enable when note is selected)
    MF.menubar.setMenuEnabled('color', false);
  }
} else {
  // Initialize color menu as disabled (will enable when note is selected)
  MF.menubar.setMenuEnabled('color', false);
}

//
setInterval(adjustListScroller, 100);

setupListScrolling();

// Menubar clock is owned by core/menubar (startClock); nothing to do here.
