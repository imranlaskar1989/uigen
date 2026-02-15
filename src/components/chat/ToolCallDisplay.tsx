import { FileEdit, FilePlus, Eye, Trash2, FolderEdit, Loader2 } from "lucide-react";

interface ToolCallDisplayProps {
  toolName: string;
  args?: Record<string, any>;
  state: "call" | "result" | "partial-call";
}

export function ToolCallDisplay({ toolName, args, state }: ToolCallDisplayProps) {
  const isLoading = state === "call" || state === "partial-call";

  const getMessage = (): { icon: React.ReactNode; text: string } => {
    if (toolName === "str_replace_editor" && args) {
      const { command, path } = args;
      const fileName = path ? path.split("/").pop() : "file";

      switch (command) {
        case "create":
          return {
            icon: <FilePlus className="w-3 h-3" />,
            text: `Creating ${fileName}`,
          };
        case "str_replace":
          return {
            icon: <FileEdit className="w-3 h-3" />,
            text: `Editing ${fileName}`,
          };
        case "insert":
          return {
            icon: <FileEdit className="w-3 h-3" />,
            text: `Adding code to ${fileName}`,
          };
        case "view":
          return {
            icon: <Eye className="w-3 h-3" />,
            text: `Reading ${fileName}`,
          };
        default:
          return {
            icon: <FileEdit className="w-3 h-3" />,
            text: `Modifying ${fileName}`,
          };
      }
    }

    if (toolName === "file_manager" && args) {
      const { command, path, new_path } = args;
      const fileName = path ? path.split("/").pop() : "file";
      const newFileName = new_path ? new_path.split("/").pop() : "";

      switch (command) {
        case "rename":
          return {
            icon: <FolderEdit className="w-3 h-3" />,
            text: `Renaming ${fileName} to ${newFileName}`,
          };
        case "delete":
          return {
            icon: <Trash2 className="w-3 h-3" />,
            text: `Deleting ${fileName}`,
          };
        default:
          return {
            icon: <FileEdit className="w-3 h-3" />,
            text: `Managing ${fileName}`,
          };
      }
    }

    return {
      icon: <FileEdit className="w-3 h-3" />,
      text: toolName,
    };
  };

  const { icon, text } = getMessage();

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      ) : (
        <div className="text-emerald-600">{icon}</div>
      )}
      <span className="text-neutral-700 font-medium">{text}</span>
    </div>
  );
}
