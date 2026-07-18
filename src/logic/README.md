# src/logic

This is the only directory meant to hold app-specific business logic. Everything outside
it (deploy config, SEO, CI workflows, sigmap wiring) is generated shell and gets updated by
re-running the wrapper's plugins, not by hand-editing.
