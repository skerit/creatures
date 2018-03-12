## 0.2.2 (WIP)

* Emit `world_name` event when a new world is detected
* Detect removed creatures and emit a `removed` event
* Recreate vbole instance when a new world is opened

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
