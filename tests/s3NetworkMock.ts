// deno-lint-ignore-file no-unused-vars require-await
import { hmac } from "https://denopkg.com/chiefbiiko/hmac@v1.0.2/mod.ts";
import { Buffer } from "https://deno.land/std@0.144.0/io/buffer.ts";
// import { StringReader } from 'https://deno.land/std@0.144.0/io/mod.ts';
import {
  copy,
  readerFromStreamReader,
} from "https://deno.land/std@0.144.0/streams/conversion.ts";

type HTTPMethodsLower = "get" | "put" | "post" | "delete" | "head";

// const dec = new TextDecoder();
const enc = new TextEncoder();

const stateKey = (bucket: string, key: string) => `${bucket}||${key}`;

const pathSelector = (url: URL) => {
  const sectionCount = url.hostname.split(".");
  // console.log({sectionCount})

  if (sectionCount.length === 4) {
    const hostParts = url.pathname.slice(1).split("/");
    if (hostParts.length === 2) {
      return { bucket: hostParts[0], key: hostParts[1] };
    } else {
      return { bucket: hostParts[0], key: "@command://createBucket" };
    }
  } else if (sectionCount.length === 5) {
    const [bucket] = url.hostname.split(".");
    return { bucket, key: url.pathname.slice(1) };
  } else {
    const er = new Error(`Could not determine bucket and key info`);
    throw er;
  }
};

const handleCreateBucket = (
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  
  // console.log('>>> Create:', bucket, key)
  const k = stateKey(bucket,key)
  
  if(state.has(k)){
    return new Response(`Conflict: ${bucket}`, { status: 409, statusText: 'Conflict' });
  }else{
    state.set(k, enc.encode(key))
    return new Response(`
    <CreateBucketResult>
      <BucketArn>arn:${bucket}</BucketArn>
    </CreateBucketResult>`, 
    { status: 200 });
  }
};

const handleGetObject = (
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  const k = stateKey(bucket, key)
  if(state.has(k)){
    const data = state.get(k)!
    return new Response( data ?? new Uint8Array(), {
      status: 200,
      headers:{
        etag:`"e1b849f9631ffc1829b2e31402373e3c"`,
        "Content-Type": "text/plain",
        "Content-Length": "5",
        "x-amz-storage-class": "STANDARD",
        "x-amz-delete-marker": "false",
        "x-amz-meta-foo": "bar",
        "x-amz-meta-baz": "qux",
      }
    })
  }else{
    return new Response(null, {status: 404})
  }
};

const handlePutObject = async (
  req: Request,
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  const buf = new Buffer();
  const defaultrdr = req.body?.getReader() as ReadableStreamDefaultReader<
    Uint8Array
  >;
  await copy(readerFromStreamReader(defaultrdr), buf);

  const { k, data } = { k: stateKey(bucket, key), data: buf.bytes() };
  // console.log({k, data})
  state.set(k, data);
  return new Response(null, { status: 200 });
};

const handleCopyObject = async (
  req: Request,
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  console.log(req.headers)

  // find
  const buf = new Buffer();
  const defaultrdr = req.body?.getReader() as ReadableStreamDefaultReader<
    Uint8Array
  >;
  await copy(readerFromStreamReader(defaultrdr), buf);
  const sourceKey = ''
  const { k, data } = { k: stateKey(bucket, sourceKey ), data: buf.bytes() };

  // set

  // respond

    

  // console.log({k, data})
  state.set(key, data);
  return new Response(null, { status: 200 });
};

const handleDeleteObject = (
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  state.delete(stateKey(bucket, key));
  return new Response(null, { status: 204 });
};

const handleListObjects = (req: Request, state: Map<string, Uint8Array>) => {
  const contentArr = [...state.entries()].map(([k, v]) => {
    return `
    <Contents>
        <Key>${k}</Key>   
        <ChecksumAlgorithm>SHA1</ChecksumAlgorithm>
        <ETag>${hmac("SHA-256", k, v, "hex")}</ETag>    
        <LastModified>${Date.now()}</LastModified>
        <Owner>
           <DisplayName>OwnerName</DisplayName>
           <ID>OwnerID</ID>
        </Owner>
        <Size>${v.byteLength}</Size>
        <StorageClass>STANDARD</StorageClass>
     </Contents>`;
  });
  const responsePayload = `
  <?xml version="1.0" encoding="UTF-8"?>
  <ListBucketResult>
     <IsTruncated>false</IsTruncated>
     <Name>string</Name>
     <Prefix>string</Prefix>
     <Delimiter>string</Delimiter>
     <MaxKeys>100</MaxKeys>
     
     <CommonPrefixes>
        <Prefix>string</Prefix>
     </CommonPrefixes>
     
     <EncodingType>string</EncodingType>
     <KeyCount>${contentArr.length}</KeyCount>

     ${contentArr.join("")}
  </ListBucketResult>`;
  // <ContinuationToken>None</ContinuationToken>
  // <NextContinuationToken>DONTEVENTRYIT-ITSALIE</NextContinuationToken>
  // <StartAfter>TheBeginning</StartAfter>
  return new Response(responsePayload, {status:200});
};

const handlePostObject = (
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  console.warn("Really???");
  console.warn("What did you try to post???");
  return new Response("return new Uint8Array([])", { status: 200 });
};

const handleHeadObject = (
  state: Map<string, Uint8Array>,
  bucket: string,
  key: string,
) => {
  const k = stateKey(bucket, key)
  
  if(state.has(k)){
    return new Response( null, {
      status: 200, 
      headers: {
        etag: `"e1b849f9631ffc1829b2e31402373e3c"`,
        "x-amz-meta-foo":"bar",
        "x-amz-meta-baz":"qux",
        "x-amz-storage-class": "STANDARD",
        "x-amz-delete-marker": 'false',
        "Content-Type": "text/plain",
        "Content-Length": '5',
        "Last-Modified": (new Date(Date.now() - 10000)).toISOString()
      }
    })
  } else{
    return new Response( null, {status: 404})
  }
};


export const terribleS3ServerMock = (
  state = new Map<string, Uint8Array>(),
) =>
  async (req: Request): Promise<Response> => {
    const m = req.method.toLowerCase() as HTTPMethodsLower;
    const url = new URL(req.url);
    const { key, bucket } = pathSelector(url);

    // console.log({ bucket, key, method: m, url });

    if (m === "get") {
      if (key === "/") {
        return handleListObjects(req, state);
      } else {
        return handleGetObject(state, bucket, key);
      }
    } else if (m === "put") {
      if (key === "@command://createBucket") {
        return handleCreateBucket(state, bucket, key);
      } else {
        if(req.headers.has("x-amz-copy-source")){
          return handleCopyObject(req, state, bucket, key);
        }else{
          return handlePutObject(req, state, bucket, key);
        }
      }
    } else if (m === "post") {
      return handlePostObject(state, bucket, key);
    } else if (m === "delete") {
      return handleDeleteObject(state, bucket, key);
    } else {
      return handleHeadObject(state, bucket, key)
    }
  };

// const localTest = async () => {
//   const b = "example";
//   const internalFetch = s3NetworkMock();

//   const req = new Request(`https:/${b}.s3.region.amazonaws.com/key42`, {
//     method: "PUT",
//     body: enc.encode("SomeData"),
//   });
//   console.log({ req });

//   const putResp = await internalFetch(req);
//   console.log(putResp);
// };

// if (import.meta.main) localTest();