## 0.2.1 (WIP)

* VBOle will now always respond with a JSON object than can optionally contain an error
* If a command should fail, other commands in the array will no longer be executed
* The JSON module in VBOle now looks for a `toJSON` function on class instances
* VBOle can now get all the child elements of a window
* VBOle will now look for error dialog boxes and inform the library

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
