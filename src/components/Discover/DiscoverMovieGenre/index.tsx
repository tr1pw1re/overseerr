import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { MovieResult } from '../../../../server/models/Search';
import useDiscover from '../../../hooks/useDiscover';
import globalMessages from '../../../i18n/globalMessages';
import Error from '../../../pages/_error';
import Button from '../../Common/Button';
import Header from '../../Common/Header';
import ListView from '../../Common/ListView';
import PageTitle from '../../Common/PageTitle';

const messages = defineMessages({
  genreMovies: '{genre} Movies',
});

const DiscoverMovieGenre: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();

  const [filters] = useState<Record<string, unknown>>({});

  const setFilter = (filter: string, value: any) => {
    filters[filter] = value;
  };

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    revalidate,
    firstResultData,
  } = useDiscover<MovieResult, { genre: { id: number; name: string } }>(
    `/api/v1/discover/movies/genre/${router.query.genreId}`,
    {
      ...filters,
    }
  );

  const applyFilter = () => {
    revalidate();
  };

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = isLoadingInitialData
    ? intl.formatMessage(globalMessages.loading)
    : intl.formatMessage(messages.genreMovies, {
        genre: firstResultData?.genre.name,
      });

  return (
    <>
      <PageTitle title={title} />
      <div className="flex flex-col justify-between mb-4 lg:items-end lg:flex-row">
        <Header>{title}</Header>
        <div className="flex flex-col flex-grow mt-2 lg:flex-row lg:flex-grow-0">
          <div className="flex flex-grow mb-2 lg:mb-0 lg:flex-grow-0 sm:mr-2 ">
            <span className="inline-flex items-center px-3 text-sm text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default rounded-l-md">
              Year
            </span>
            <input
              className="rounded-r-only"
              type="text"
              onChange={(e) => {
                setFilter('releaseYear', parseInt(e.target.value));
              }}
            ></input>
          </div>

          <div className="flex flex-col justify-between flex-grow mb-2 sm:flex-row lg:mb-0 lg:flex-grow-0">
            <Button
              className="flex-grow mb-2 sm:mb-0 sm:mr-2 outline"
              buttonType="primary"
              onClick={() => applyFilter()}
            >
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </div>

      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverMovieGenre;
