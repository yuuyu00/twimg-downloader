// import * as twitter from "twitter-v2";
import * as Twitter from "twitter";
import { execSync } from "child_process";
import { Media } from "./types";
import { getImages, getMovies } from "./utils";

const client = new Twitter({
  consumer_key: "ELcHBKkYF2Ui7wXibvaKg3Yxc",
  consumer_secret: "6NwK7fXLhw25xQ6WAZQmW8tOXYyDggcDIEUfcPNDPU8JS5VEnt",
  access_token_key: "1108739604553691137-QWynCEVMxSg5te0FOapICCYPVdg9jE",
  access_token_secret: "uJkectqOGrpV5caTsvmp6h1iU0pX9hBIU5q8X7nQHYBN1",
});

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
  console.log(tweets);

  const movieList = tweets
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
    .filter(
      (tweet) =>
        tweet.extended_entities &&
        tweet.extended_entities.media[0] &&
        !tweet.extended_entities.media[0].video_info
    )
    .map((tweet) => {
      if (!tweet.entities || !tweet.entities.media) return;

      return tweet.entities.media.map((m) => ({
        title: tweet.full_text
          .replace(/\r?\n/g, " ")
          .replace(/https:\/\/t.co\/.*/, ""),
        url: m.media_url_https,
      }));
    })
    .reduce((acc, cur) => [...acc, ...cur], []);

  if (tweets.length < 195) {
    return {
      movieList: [...movieList, ...argMovieList],
      imageList: [...imageList, ...argImageList],
    };
  }

  console.log("fetch onemore", tweets.slice(-1)[0].id);
  return getMedias(
    userName,
    [...imageList, ...argImageList],
    [...movieList, ...argMovieList],
    tweets.slice(-1)[0].id
  );
};

const main = async () => {
  const userName = process.argv[2];
  if (!userName) throw new Error("userName is required");

  execSync(`rm -rf dist/${userName} && mkdir dist/${userName}`);

  const { imageList, movieList } = await getMedias(userName);
  console.log(movieList);
  getImages(imageList, userName);
  getMovies(movieList, userName);
};
main();
