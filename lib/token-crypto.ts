import {createCipheriv,createDecipheriv,randomBytes,createHash} from "node:crypto";
export const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
function key(){const value=Buffer.from(process.env.TOKEN_ENCRYPTION_KEY||"","base64");if(value.length!==32)throw Error("TOKEN_ENCRYPTION_KEY precisa de 32 bytes em base64.");return value}
export function encrypt(value:unknown){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return [iv,cipher.getAuthTag(),ciphertext].map(v=>v.toString("base64url")).join(".")}
export function decrypt(value:string){const [iv,tag,data]=value.split(".").map(v=>Buffer.from(v,"base64url"));const decipher=createDecipheriv("aes-256-gcm",key(),iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(data),decipher.final()]).toString("utf8"))}
