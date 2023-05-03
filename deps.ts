export interface Signer{
  sign: (service: string, request: Request) => Promise<Request>
}

export interface Credentials {
  awsAccessKeyId: string;
  awsSecretKey: string;
  sessionToken?: string;
} 

export { awsV4Sig, toAmz, toDateStamp } from './src/aws-url-signer.ts'
export { default as parseXML } from "https://denopkg.com/nekobato/deno-xml-parser@master/index.ts";
export { decode as decodeXMLEntities } from "https://deno.land/x/html_entities@v1.0/lib/xml-entities.js";
export { pooledMap } from "https://deno.land/std@0.115.1/async/pool.ts";