1. Opening and Creating projects
1.5. Mobile and Desktop Version with different icons sizes and adjusted behaviour for mobile devices
2. Creating files and folders in open project
    - Only one file / folder can be make atime and it can be: file or folder
3. Draging and dropping files and folders to the other folders or to the main scope
4. Right Click to display the context menu element with buttons for the specific operation
    - Allow user to specify his own context menu
    - `Context Menu` has these default elements:
        * File
            - Cut
            - Copy 
            ----
            - Copy Path
            - Copy Relative Path
            ---- 
            - Rename
            - Delete
        * Folder
            - New File
            - New Folder
            ---- 
            - Cut
            - Copy 
            ----
            - Copy Path
            - Copy Relative Path
            ---- 
            - Rename
            - Delete - Displays confirmation if folder has the subcomponents within
5. Files and folders gets icons shown in same fashion as vscode is doing
    - file: this is for specific extension has the file
    - folder: shows the base on the folder name e.g: .storybook / .svelte-kit
    - TODO: find the iconfiy library can help me to implement these features