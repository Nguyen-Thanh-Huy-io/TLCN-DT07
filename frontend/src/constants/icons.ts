/**
 * Icon Name Enum
 * Eliminates all magic string icon names across the application
 */
export enum IconName {
  GRID = 'grid',
  CLOCK = 'clock',
  FOLDER = 'folder',
  BOOK = 'book',
  CALENDAR = 'calendar',
  TAG = 'tag',
  CHECK = 'check',
  USERS = 'users',
  SEARCH = 'search',
  BELL = 'bell',
  CHEVRON = 'chevron',
  CHEVRON_LEFT = 'chevron-left',
  MORE = 'more',
  PLUS = 'plus',
  ARROW = 'arrow',
  LOGOUT = 'logout',
  MENU = 'menu',
  EDIT = 'edit',
  EYE = 'eye',
  TRASH = 'trash',
  FILTER = 'filter',
  SPARK = 'spark',
}

export type IconNameType = `${IconName}`;
