//
// NOTE:
//
// 1. Fill out this file with your own values
// 2. Copy/Paste the contents to a new file
// 3. Save the new file as `env.ts`
// 
// 4. DO NOT CHECK THIS FILE INTO your repo
// 5. REPEATED: DO NOT CHECK THIS INFO INTO YOUR OWN REPO
//
export const my_uuid = 111222333444 // Replace by Copy/Paste from deno REPL >> Math.round( Math.random()*1e12 ) 
export default {
    "bucket": `com-github-ericdmoore-s3-deno-${my_uuid}`,
    "region": "us-central-1",
    "endpointURL": "S3_ENDPOINT_URL",
    "accessKeyID": "AWS_ACCESS_KEY_ID",
    "secretKey": "AWS_SECRET_ACCESS_KEY"
}