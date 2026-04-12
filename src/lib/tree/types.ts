export interface File {
    id: string;
    type: "file";
    /** It's file name with file extension */
    name: string;
}

export interface Folder {
    id: string;
    type: "folder";
    name: string;
    subentries: (Folder | File)[];
}

export interface Project {
    /** It's unique file id */
    id: string;
    name: string;
    /** Specified only for project name */
    gitRepositoryURL?: string;
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
