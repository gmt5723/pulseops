## Recent check history
- React state stores the latest 20 completed checks, newest first.
- Each entry has a unique ID used as its React key.
- Functional state updates use the previous history.
- Validation errors do not create history entries.
- Refreshing clears history because it is not persisted.