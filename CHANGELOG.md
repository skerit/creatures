## 0.2.8 (WIP)

* Allow maximum 10 entries in the `creatures_queue`, before finally executing the next function in the queue
* Make sure calling back with an error does not block queues
* Add classification system & known scriptorium object names

## 0.2.7 (2018-04-27)

* Remove limitation count on vbole.exe reconnects
* Fix creature update overload
* Only allow 1 egg update script at a time
* Don't move a creature to invalid coordinates
* Make sure local creature info is updated before it is exported
* Retry file reads that fialed with `ENOENT` if they're export files
* Retry getting a parent for generation calculation if the reason is a timeout
* Do not load creature history file if it is empty

## 0.2.6 (2018-04-22)

* Fix getting parents of an egg
* [VB] Also try to identify creatures2.exe against it shortname, creatu~1.exe
* [VB] Add ability to get text content of a window
* [VB] Add `getspeed` command
* Fixed bug where Creature instances not in-game would be destroyed immediately
* Add `CreaturesApplication#creature_count` property, which gives the amount of creatures in the current world
* Cache `CreaturesApplication#getWorldName` for 60 seconds
* Add `Creature#getOwnerData` and `Creature#setNotes`
* Add simple `serialize` and `parse` methods for use in `LString` fields
* [VB] Add retries to getting a window by name or handle, reducing timeouts

## 0.2.5 (2018-03-26)

* [VB] Kill any creatures2.exe process without a window on boot
* [VB] Fix bug where the main "Creatures 2" window was closed
* [VB] No longer iterate through ALL open windows (which was the case when `handle` was 0)
* See what the pause state is before resuming during `doUnpaused`
* Find the correct age of an exported creature

## 0.2.4 (2018-03-26)

* Add `CreaturesApplication#saveGame(callback)` which can save the game when using the `blueberry4$` cheat
* Fix `Creature#teachLanguage()` not working properly
* Add methods to enable powerups
* When no creatures are in the world `getCreatureIds` will no longer callback with an array with 1 empty id string
* Add `log` method to base class
* Get X & Y position of creature on update
* Update creature info before exporting
* You can now supply a position when importing a creature
* Add an initial error dialogbox check on init
* Add `readFile` method that will retry reading a file on `EBUSY` errors
* `Creature#update` can now timeout
* Get the room type a creature is in on update
* Fix gene reading (except dendrites)
* Gene flags are now also parsed
* Implement pigment & pigment bleed
* Add methods to get parents of an egg
* Add methods to get hatchery & egg limit

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
