// import * as twitter from "twitter-v2";
import * as Twitter from "twitter";
import * as fs from "fs";
import * as AdmZip from "adm-zip";
import { Media } from "./types";
import { getImages, getMovies } from "./utils";
import * as S3 from "aws-sdk/clients/s3";

const client = new Twitter({
  consumer_key: "ELcHBKkYF2Ui7wXibvaKg3Yxc",
  consumer_secret: "6NwK7fXLhw25xQ6WAZQmW8tOXYyDggcDIEUfcPNDPU8JS5VEnt",
  access_token_key: "1108739604553691137-QWynCEVMxSg5te0FOapICCYPVdg9jE",
  access_token_secret: "uJkectqOGrpV5caTsvmp6h1iU0pX9hBIU5q8X7nQHYBN1",
});
const S3_BUCKET_NAME = "twi-image-downloader-contents";

type Tweet = {
  id: number;
  id_str: string;
  full_text: string;
  entities: {
    media?: [
      {
        id: number;
        id_str: string;
        media_url: string;
        media_url_https: string;
      }
    ];
  };
  extended_entities?: {
    media: [
      {
        id: number;
        id_str: string;
        media_url_https: string;
        video_info: {
          aspect_ratio: number[];
          duration_millis: number;
          variants: [
            {
              bitrate?: number;
              content_type: string;
              url: string;
            }
          ];
        };
      }
    ];
  };
};

const getMedias = async (
  userName: string,
  argImageList: Media[] = [],
  argMovieList: Media[] = [],
  fetchFromId?: number
) => {
  const options = fetchFromId
    ? {
        screen_name: userName,
        tweet_mode: "extended",
        trim_user: true,
        count: 200,
        max_id: fetchFromId,
      }
    : {
        screen_name: userName,
        tweet_mode: "extended",
        trim_user: true,
        count: 200,
      };
  const tweets = (await client.get(
    "statuses/user_timeline.json",
    options
  )) as Tweet[];

  const movieList = tweets
    .filter((tweet) => !/RT /.test(tweet.full_text))
    .map((tweet) => {
      if (
        !tweet.extended_entities ||
        !tweet.extended_entities.media[0] ||
        !tweet.extended_entities.media[0].video_info
      )
        return;

      const url = tweet.extended_entities.media[0].video_info.variants
        .reduce(
          (variant, cur) => {
            if (!("bitrate" in cur)) return variant;

            return cur.bitrate > variant.bitrate ? cur : variant;
          },
          { bitrate: 0, content_type: "", url: "" }
        )
        .url.replace(/\?tag=.*/, "");

      return {
        title: tweet.full_text
          .replace(/\r?\n/g, "")
          .replace(/https:\/\/t.co\/.*/, ""),
        url,
      };
    })
    .filter((item) => item !== undefined && item.url !== "");

  const imageList = tweets
    .filter((tweet) => !/RT /.test(tweet.full_text))
    .reduce((list, tweet) => {
      if (!tweet.extended_entities || !tweet.extended_entities.media)
        return list;
      if (tweet.extended_entities.media[0].video_info) return list;

      return [
        ...list,
        ...tweet.extended_entities.media.map((m) => ({
          title: tweet.full_text
            .replace(/\r?\n/g, " ")
            .replace(/https:\/\/t.co\/.*/, ""),
          url: m.media_url_https,
        })),
      ];
    }, [] as Media[]);

  if (tweets.length < 100) {
    return {
      movieList: [...argMovieList, ...movieList],
      imageList: [...argImageList, ...imageList],
    };
  }

  return getMedias(
    userName,
    [...argImageList, ...imageList],
    [...argMovieList, ...movieList],
    tweets.slice(-1)[0].id
  );
};

const getPresignedUrl = async (key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      "getObject",
      {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Expires: 30,
      },
      (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      }
    );
  });
};

const s3 = new S3();
export const handler = async (event) => {
  const userName = event.userName;
  if (!userName) {
    return {
      status: 400,
      body: "userName is required.",
    };
  }

  const zip = new AdmZip();

  const { imageList, movieList } = await getMedias(userName);
  const imageDataList = await getImages(imageList);
  const moviePathList = await getMovies(movieList);

  imageDataList.map((data, index) => zip.addFile(`/img_${index}.jpg`, data));
  moviePathList.map((path) => zip.addLocalFile(path));

  zip.writeZip("/tmp/contents.zip");

  const fileKey = `${userName}_${new Date().toISOString()}.zip`;
  await s3
    .putObject({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      Body: fs.readFileSync("/tmp/contents.zip"),
    })
    .promise();
  const url = await getPresignedUrl(fileKey);

  return {
    status: 200,
    body: { url },
  };
};

// const main = async () => {
//   const userName = process.argv[2];
//   if (!userName) throw new Error("userName is required");

//   const { imageList, movieList } = await getMedias(userName);
//   console.log(imageList);
//   getImages(imageList);
// };

// main();
