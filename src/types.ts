export type Media = {
  title: string;
  url: string;
};

export type Tweet = {
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
