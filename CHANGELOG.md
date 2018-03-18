## 0.2.4 (WIP)

* Add `CreaturesApplication#saveGame(callback)` which can save the game when using the `blueberry4$` cheat
* Fix `Creature#techLanguage()` not working properly
* Add methods to enable powerups

## 0.2.3 (2018-03-17)

* Make sure `SfcOle` calls the `done` task after receiving error responses
* Find the creatures2 executable in some common places if the game isn't running
* Only run some commands 'till after the ready signal.

## 0.2.2 (2018-03-15)

* Emit `world_name` event when a new world is detected
* Detect removed creatures and emit a `removed` event
* Recreate vbole instance when a new world is opened
* Add command timeout checks
* Fix `Creature#getBodyPartImage` being deadlocked waiting for `ready` event
* Fix getting information for the `World.sfc` world, which stored data in other locations
* If unable to get a gene file in the documents directories, get it from the main application directory
* Fix `S16#load` from getting stuck in an infinite loop
* Fix `Genome#getBodyPartImage` so that it tries all lower lifestages before giving up (especially needed for ettins)
* Get locale & language of the current windows environment
* Add English, Dutch & French menu keys mappings
* Make the Import & Export functions work in all languages (except Japanese)
* Fix the sendKeys functionality on Windows 10 (needed to send {DOWN} to actually open a menu)
* Add some more context info to VBOLE errors
* [VB] Fix identifying other windows with "Creatures 2" as their title as the C2 window (for example explorer windows in a folder named "Creatures 2")
* Add `Creature#select(callback)` method to make it the active creature
* If the creature's name starts with a "<", or it is the moniker or hex moniker, it is deemed "unnamed"
* `CreaturesApplication#getProcessPath` will now callback with the path to the process as a string instead of a wrapped object
* Callback with error if loading history files fails in `Creature#getWorldNames`

## 0.2.1 (2018-03-12)

* VBOle will now always respond with a JSON object than can optionally contain an error
* If a command should fail, other commands in the array will no longer be executed
* [VB] The JSON module in VBOle now looks for a `toJSON` function on class instances
* [VB] VBOle can now get all the child elements of a window
* [VB] VBOle will now look for error dialog boxes and inform the library
* The `SFCOle` class will now emit `vbole_error` errors, for when certain dialogs pop up
* The `CreaturesApplication` class will forward these errors as either `error_dialogbox` or `error_vbole`. A callback is provided with which you have to respond.
* [VB] Add `WriteDebug` method & flush outputs
* [VB] Another VBOle instance is created for monitoring error dialogs during CAOS commands
* [VB] VBOle now accepts a startup argument as json
* Add `SFCOle#escapeKeys` to escape a `SendKeys` string
* Copy `.exp` files to a temporary location before importing them, so they do not get removed
* Add `Export` class to read in exp files (only gets the moniker for now)
* [VB] Get all C2Window child elements, return them to the `c2window_elements` command
* [VB] Add `play` and `pause` command, which sets the "paus" variable using CAOS
* Added `CreaturesApplication` method `play`, `pause`, `getIsPlaying` and `doUnpaused`
* Fix the `Egg` class
* Add `Chemistry` class and chemicals
* Moved `Creature#getBodyPartImage` to `Genome` class
* Add `Creature#inseminate` method

## 0.2.0 (2018-02-17)

* Add speedhack functionality
* Expand vbole capabilities
* Added S16 class
* Added Base class from which all others inherit
* [VB] Added `Window#getProcessPath` to VBOle and implemented the `getprocesspath` command
* Added `Creature#teachLanguage` (you still need to re-set the creature's name, though)
* Fix the `Creature#move` command

## 0.1.1

* Add getting generation of creature
* Enable setting of name

## 0.1.0 (2016-05-02)

* Execute CAOS commands via VB6 executable
* Add vbole.exe source code
* Load creature history from files
* Get world information, guess current world
* Initial Github commit and npm release
