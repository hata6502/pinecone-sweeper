import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { FunctionComponent, useEffect, useRef } from "react";
import useSWR from "swr";

import { Minesweeper } from "./minesweeper";

const faqs = [
  {
    title: "写真地図",
    url: "https://almap.hata6502.com/",
  },
  {
    title: "premyお絵かき",
    url: "https://premy.hata6502.com/",
  },
  {
    title: "超重量級おふとん",
    url: "https://scrapbox.io/hata6502/%E8%B6%85%E9%87%8D%E9%87%8F%E7%B4%9A%E3%81%8A%E3%81%B5%E3%81%A8%E3%82%93",
  },
];

const tweetIDsURL =
  "https://script.google.com/macros/s/AKfycbx1Lec0RXfLou1Ixz3-hg6lFHoQdkTDSCFhtYIwQ9_OyWx36f3JYIxGdia9kLdx4DYe/exec";

export const App: FunctionComponent = () => {
  return (
    <div className="mx-auto mb-16 max-w-4xl bg-white px-8">
      <div className="mt-16">
        <h2 className="flex flex-col-reverse items-center justify-center gap-4 text-center text-5xl font-bold break-words break-keep md:flex-row">
          マツボックリ
          <wbr />
          スイーパー
          <img src="favicon.png" className="inline w-20" />
        </h2>
      </div>

      <div className="mt-16">
        <Minesweeper />
      </div>

      <div className="mt-16">
        <Tweets />
      </div>

      <div className="mt-16">
        <div className="divide-y divide-gray-900/10">
          {faqs.map(({ title, url }) => (
            <a
              key={title}
              href={url}
              target="_blank"
              className="flex items-center gap-x-2 py-6"
            >
              <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
              <span className="leading-7 font-semibold">{title}</span>
            </a>
          ))}
        </div>
      </div>

      <footer className="mt-16">
        <p className="text-xs leading-5 text-gray-500">
          {new Date().getFullYear()}
          &nbsp;
          <a
            href="https://twitter.com/hata6502"
            target="_blank"
            className="hover:text-gray-600"
          >
            ムギュウ
          </a>
          &emsp;
          <a
            href="https://scrapbox.io/hata6502/%E3%83%9E%E3%83%84%E3%83%9C%E3%83%83%E3%82%AF%E3%83%AA%E3%82%B9%E3%82%A4%E3%83%BC%E3%83%91%E3%83%BC%E5%85%8D%E8%B2%AC%E4%BA%8B%E9%A0%85"
            target="_blank"
            className="hover:text-gray-600"
          >
            免責事項
          </a>
        </p>
      </footer>
    </div>
  );
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
};

const Tweets: FunctionComponent = () => {
  const { data: tweetIDs } = useSWR<string[]>(tweetIDsURL, fetcher);
  if (!tweetIDs) {
    throw new Error("tweetIDs is undefined. ");
  }

  const tweetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tweetContainerRef.current) {
      return;
    }
    const tweetContainerElement = tweetContainerRef.current;

    for (const tweetID of tweetIDs) {
      const tweetElement = document.createElement("div");
      // @ts-expect-error
      twttr.widgets.createTweet(tweetID, tweetElement);

      tweetContainerElement.append(tweetElement);
    }
  }, []);

  return (
    <div
      ref={tweetContainerRef}
      className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3"
    />
  );
};
