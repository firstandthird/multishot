
0.3.0 / 2013-10-15 
==================

  * Fixed url undefined error.
  * Added notes to readme about prefix.
  * Added prefix support.
  * Changed the script to require .start() to be called in order to ensure events have been bound in time.
  * Checks if webkit2png is available inside the Screenshot method and now throws an error if it doesn't.
  * Updated readme to show the real default output directory.

0.2.0 / 2013-10-06 
==================

 * Merge branch 'feature/passable-styles'
 * Merge pull request #25 from firstandthird/feature/webkit2png-options
 * Merge pull request #27 from firstandthird/bug/missing-repository
 * Updated package.json to have repository field.
 * Merge branch 'master' into feature/passable-styles
 * Renamed lib to match upcoming changes in another branch.
 * Merge branch 'master' into feature/webkit2png-options
 * Working profiles and mobile view. See readme for usage.
 * WIP - More options for webkit2png.
 * Fixed incorrect base path.
 * Release 0.1.3
 * Fixed group not getting a single url.
 * [#5] - Added a check is webkit2png is available. We might be able to use this to detect other screenshot apps down the road.
 * [#12] - Output directory defaults to current directory.
 * WIP - #18, #19 - User agent and widths
 * Addded a way to pass in styles to override defaults

0.1.4 / 2013-10-03 
==================

  * Fixed incorrect base path.

0.1.3 / 2013-10-03 
==================

  * Merge pull request #17 from firstandthird/feature/check-webkit2png
  * Merge pull request #16 from firstandthird/feature/default-output-directory
  * Merge pull request #22 from firstandthird/bug/grouped-doesnt-contain-single-url
  * Fixed group not getting a single url.
  * [#5] - Added a check is webkit2png is available. We might be able to use this to detect other screenshot apps down the road.
  * [#12] - Output directory defaults to current directory.
