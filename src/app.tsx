import { DocumentTextIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FunctionComponent, Suspense, useEffect, useRef } from "react";
import useSWR from "swr";

import { Minesweeper } from "./minesweeper";

const faqs = [
  {
    title: "premyお絵かきアプリ",
    url: "https://premy.hata6502.com/",
  },
  {
    title: "mibae filter開発風景",
    url: "https://scrapbox.io/hata6502/mibae_filter",
  },
  {
    title: "写真地図",
    url: "https://almap.hata6502.com/",
  },
];

const tweetIDsURL =
  "https://script.google.com/macros/s/AKfycbx1Lec0RXfLou1Ixz3-hg6lFHoQdkTDSCFhtYIwQ9_OyWx36f3JYIxGdia9kLdx4DYe/exec";

export const App: FunctionComponent = () => {
  const handleShareButtonClick = () => {};

  return (
    <div className="mx-auto mb-16 max-w-4xl bg-white px-8">
      <div className="mt-16">
        <h2 className="flex flex-col-reverse items-center gap-4 text-5xl font-bold break-words break-keep md:flex-row">
          マツボックリ
          <wbr />
          スイーパー
          <img src="favicon.png" className="inline w-18" />
        </h2>

        <p className="mt-8">マツボックリが落ちてる写真を撮って遊ぼう。</p>
      </div>

      <div className="mt-16">
        <Minesweeper />
      </div>

      <div className="mt-16">
        {true && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://twitter.com/intent/tweet?${new URLSearchParams({
                  hashtags: "マツボックリスイーパー",
                  url: "https://pinecone.hata6502.com/",
                })}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-x-2 rounded-md bg-neutral-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                onClick={handleShareButtonClick}
              >
                Xにポスト
                <ShareIcon className="h-6 w-6" aria-hidden="true" />
              </a>
            </div>

            <p className="mt-4">
              #マツボックリスイーパー
              タグ付きでXにポストすると、このサイトに掲載されることがあります。
            </p>
          </div>
        )}

        <Suspense>
          <Tweets />
        </Suspense>
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
            href="https://scrapbox.io/hata6502/premy%E5%85%8D%E8%B2%AC%E4%BA%8B%E9%A0%85"
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
