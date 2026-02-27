import {Sandbox} from "@e2b/code-interpreter";

const IGNORE = ['node_modules', '.next', '.npm', '.config', 'public'];

export const getFiles = async (sandbox: Sandbox ) => {
    let all = await sandbox.files.list("/home/user", {depth: 99});
    const filtered_files = all.filter(f => {
        return !f.path.replace('/home/user','').split('/').some(p => IGNORE.includes(p));
        
    })
    return filtered_files;
}

export const getFileData= async (sandbox: Sandbox, path: string) => {
    const content = await sandbox.files.read(path);
    return content;
}