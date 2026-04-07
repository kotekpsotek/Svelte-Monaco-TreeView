export interface File {
    type: "file";
    /** It's file name with file extension */
    name: string;
    /** When open file content is showing */
    isOpen?: boolean;
}

export interface Folder {
    type: "folder";
    name: string;
    /** When open `subentries` are shown */
    isOpen?: boolean;
    subentries: (Folder | File)[];
}

export interface Project {
    name: string;
    /** Specified only for project name */
    gitRepositoryURL?: string;
    isOpen?: boolean;
    entries: (Folder | File)[];
}

export interface IFileIcon {
    /** List with extensions will cause to show the icon */
    fileExtensions: string[];
    /** Name of file is icon without specifying the folder since we now the folder where are extensions */
    iconFileName: string;
}

export interface IFolderIcon {
    /** If majority of folder is the specified set with extensions the icon will be following */
    folderMajorityFileExtensions: string[];
    /** Name of file is icon without specifying the folder since we now the folder where are extensions */
    iconFileName: string;
}
