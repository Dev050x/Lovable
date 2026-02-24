import type { TOOL_CALL as TOOL_CALL_TYPE} from "@prisma/client";
import { TOOL_CALL } from "@prisma/client";
import { deleteFile, updateFile } from "../tool.js";

export const mapToolCallToEnum = (toolName: string): TOOL_CALL_TYPE => {
    const map: Record<string, TOOL_CALL_TYPE> = {
        "createFile": TOOL_CALL.WRITE_FILE,
        "readFile": TOOL_CALL.READ_FILE,
        "updateFile": TOOL_CALL.UPDATE_FILE,
        "deleteFile": TOOL_CALL.DELETE_FILE
    }
    return map[toolName]!;
}

export const mapToolCallToChat = (toolCall: TOOL_CALL_TYPE, location: string): string => {

    const map: Record<TOOL_CALL_TYPE, string> = {
        [TOOL_CALL.WRITE_FILE]: `creating file ${location}`,
        [TOOL_CALL.READ_FILE]: `reading file ${location}`,
        [TOOL_CALL.UPDATE_FILE]: `updating file ${location}`,
        [TOOL_CALL.DELETE_FILE]: `deleting file ${location}`
    }
    return map[toolCall];
}

