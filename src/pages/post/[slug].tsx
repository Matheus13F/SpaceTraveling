/* eslint-disable react/no-danger */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from "next/head";
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { FiCalendar, FiClock, FiGithub, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>@gisabernardess | spacetraveling</title>
        </Head>
        <Header />
        <main>Carregando...</main>
      </>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const estimatedReadTime = useMemo(() => {
    if (router.isFallback) return 0;

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;
        const bodyWords = currentContent.body.reduce(
          (summedBodies, currentBody) => {
            const textWords = currentBody.text.split(/\s/g).length;
            return summedBodies + textWords;
          },
          0
        );
        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  const isPostEdited =
    post.last_publication_date &&
    post.last_publication_date !== post.first_publication_date;

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
        <meta name="description" content={post.data.title} />
      </Head>

      <Header />

      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <article className={`${commonStyles.container} ${styles.post}`}>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <FiCalendar />
              {post.first_publication_date}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <time>
              <FiClock />
              {estimatedReadTime} min
            </time>
          </div>

          {isPostEdited && (
            <span>
              * editado em  
              {post.first_publication_date}
            </span>
          )}

          {post.data.content.map(content => (
            <section key={content.heading} className={styles.postContent}>
              <h1>{content.heading}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: content.body[0].text,
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.getAllByType("post", {
    pageSize: 2,
    fetch: ['post.title']
  });

  const paths = response.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID("post", String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content
    }
  };

  if (!response) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post
    },
    redirect: 60 * 60, // 1 hour
  };
};
