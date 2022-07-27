
// SIGNER is causing a priv escalation
export type { Credentials } from "https://deno.land/x/aws_sign_v4@1.0.2/mod.ts";
export { awsV4Sig, toAmz, toDateStamp } from 'https://denopkg.com/ericdmoore/feedBarber@main/src/lib/client/aws-url-signer.ts'

export { default as parseXML } from "https://raw.githubusercontent.com/nekobato/deno-xml-parser/0bc4c2bd2f5fad36d274279978ca57eec57c680c/index.ts";
export { decode as decodeXMLEntities } from "https://deno.land/x/html_entities@v1.0/lib/xml-entities.js";
export { pooledMap } from "https://deno.land/std@0.115.1/async/pool.ts";

export interface Signer{
  sign: (service: string, request: Request) => Promise<Request>
}