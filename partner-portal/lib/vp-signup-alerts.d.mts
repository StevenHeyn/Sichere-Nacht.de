export function queueSignupAdminNotification(input:{userId:string;email:string}):Promise<{sent:number;failed:number}|void>;
export function sendSignupAdminNotifications(input?:{limit?:number;userId?:string|null}):Promise<{sent:number;failed:number}>;
