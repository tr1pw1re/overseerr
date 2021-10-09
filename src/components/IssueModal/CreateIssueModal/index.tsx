import { RadioGroup } from '@headlessui/react';
import { ExclamationIcon } from '@heroicons/react/outline';
import { ArrowCircleRightIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Formik } from 'formik';
import Link from 'next/link';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import type Issue from '../../../../server/entity/Issue';
import { MovieDetails } from '../../../../server/models/Movie';
import { TvDetails } from '../../../../server/models/Tv';
import globalMessages from '../../../i18n/globalMessages';
import Button from '../../Common/Button';
import Modal from '../../Common/Modal';
import { issueOptions } from '../constants';

const messages = defineMessages({
  validationMessageRequired: 'You must provide a message',
  issomethingwrong: 'Is something wrong with {title}?',
  whatswrong: "What's wrong?",
  providedetail: 'Provide a detailed explanation of the issue you are having.',
  season: 'Season {seasonNumber}',
  episode: 'Episode {episodeNumber}',
  allseasons: 'All Seasons',
  allepisodes: 'All Episodes',
  problemseason: 'Problem Season',
  problemepisode: 'Problem Episode',
  toastSuccessCreate: 'Created an issue for <strong>{title}</strong>',
  toastFailedCreate: 'Something went wrong while creating the issue.',
  toastviewissue: 'View Issue',
  reportissue: 'Report an Issue',
  submitissue: 'Submit Issue',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

interface CreateIssueModalProps {
  mediaType: 'movie' | 'tv';
  tmdbId?: number;
  onCancel?: () => void;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  onCancel,
  mediaType,
  tmdbId,
}) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails | TvDetails>(
    tmdbId ? `/api/v1/${mediaType}/${tmdbId}` : null
  );

  if (!tmdbId) {
    return null;
  }

  const CreateIssueModalSchema = Yup.object().shape({
    message: Yup.string().required(
      intl.formatMessage(messages.validationMessageRequired)
    ),
  });

  return (
    <Formik
      initialValues={{
        selectedIssue: issueOptions[0],
        message: '',
        problemSeason: 0,
        problemEpisode: 0,
      }}
      validationSchema={CreateIssueModalSchema}
      onSubmit={async (values) => {
        try {
          const newIssue = await axios.post<Issue>('/api/v1/issue', {
            issueType: values.selectedIssue.issueType,
            message: values.message,
            mediaId: data?.mediaInfo?.id,
            problemSeason: values.problemSeason,
            problemEpisode:
              values.problemSeason > 0 ? values.problemEpisode : 0,
          });

          if (data) {
            addToast(
              <>
                <div>
                  {intl.formatMessage(messages.toastSuccessCreate, {
                    title: isMovie(data) ? data.title : data.name,
                    strong: function strong(msg) {
                      return <strong>{msg}</strong>;
                    },
                  })}
                </div>
                <Link href={`/issues/${newIssue.data.id}`}>
                  <Button as="a" className="mt-4">
                    <span>{intl.formatMessage(messages.toastviewissue)}</span>
                    <ArrowCircleRightIcon />
                  </Button>
                </Link>
              </>,
              {
                appearance: 'success',
                autoDismiss: true,
              }
            );
          }

          if (onCancel) {
            onCancel();
          }
        } catch (e) {
          addToast(intl.formatMessage(messages.toastFailedCreate), {
            appearance: 'error',
            autoDismiss: true,
          });
          console.log(e);
        }
      }}
    >
      {({ handleSubmit, values, setFieldValue, errors, touched }) => {
        return (
          <Modal
            backgroundClickable
            onCancel={onCancel}
            iconSvg={<ExclamationIcon />}
            title={intl.formatMessage(messages.reportissue)}
            cancelText={intl.formatMessage(globalMessages.close)}
            onOk={() => handleSubmit()}
            okText={intl.formatMessage(messages.submitissue)}
            loading={!data && !error}
            backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
          >
            {data && (
              <div className="flex items-center">
                <span className="mr-1 font-semibold">
                  {intl.formatMessage(messages.issomethingwrong, {
                    title: isMovie(data) ? data.title : data.name,
                  })}
                </span>
              </div>
            )}
            {mediaType === 'tv' && data && !isMovie(data) && (
              <>
                <div className="form-row">
                  <label htmlFor="problemSeason" className="text-label">
                    {intl.formatMessage(messages.problemseason)}
                    <span className="label-required">*</span>
                  </label>
                  <div className="form-input">
                    <div className="form-input-field">
                      <Field
                        as="select"
                        id="problemSeason"
                        name="problemSeason"
                      >
                        <option value={0}>
                          {intl.formatMessage(messages.allseasons)}
                        </option>
                        {data.seasons.map((season) => (
                          <option
                            value={season.seasonNumber}
                            key={`problem-season-${season.seasonNumber}`}
                          >
                            {intl.formatMessage(messages.season, {
                              seasonNumber: season.seasonNumber,
                            })}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>
                </div>
                {values.problemSeason > 0 && (
                  <div className="mb-2 form-row">
                    <label htmlFor="problemEpisode" className="text-label">
                      {intl.formatMessage(messages.problemepisode)}
                      <span className="label-required">*</span>
                    </label>
                    <div className="form-input">
                      <div className="form-input-field">
                        <Field
                          as="select"
                          id="problemEpisode"
                          name="problemEpisode"
                        >
                          <option value={0}>
                            {intl.formatMessage(messages.allepisodes)}
                          </option>
                          {[
                            ...Array(
                              data.seasons.find(
                                (season) =>
                                  Number(values.problemSeason) ===
                                  season.seasonNumber
                              )?.episodeCount ?? 0
                            ),
                          ].map((i, index) => (
                            <option
                              value={index + 1}
                              key={`problem-episode-${index + 1}`}
                            >
                              {intl.formatMessage(messages.episode, {
                                episodeNumber: index + 1,
                              })}
                            </option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <RadioGroup
              value={values.selectedIssue}
              onChange={(issue) => setFieldValue('selectedIssue', issue)}
              className="mt-4"
            >
              <RadioGroup.Label className="sr-only">
                Select an Issue
              </RadioGroup.Label>
              <div className="-space-y-px overflow-hidden bg-gray-800 rounded-md bg-opacity-30">
                {issueOptions.map((setting, index) => (
                  <RadioGroup.Option
                    key={`issue-type-${setting.issueType}`}
                    value={setting}
                    className={({ checked }) =>
                      classNames(
                        index === 0 ? 'rounded-tl-md rounded-tr-md' : '',
                        index === issueOptions.length - 1
                          ? 'rounded-bl-md rounded-br-md'
                          : '',
                        checked
                          ? 'bg-indigo-600 border-indigo-500 z-10'
                          : 'border-gray-500',
                        'relative border p-4 flex cursor-pointer focus:outline-none'
                      )
                    }
                  >
                    {({ active, checked }) => (
                      <>
                        <span
                          className={`${
                            checked
                              ? 'bg-indigo-800 border-transparent'
                              : 'bg-white border-gray-300'
                          } ${
                            active ? 'ring-2 ring-offset-2 ring-indigo-300' : ''
                          } h-4 w-4 mt-0.5 cursor-pointer rounded-full border flex items-center justify-center`}
                          aria-hidden="true"
                        >
                          <span className="rounded-full bg-white w-1.5 h-1.5" />
                        </span>
                        <div className="flex flex-col ml-3">
                          <RadioGroup.Label
                            as="span"
                            className={`block text-sm font-medium ${
                              checked ? 'text-indigo-100' : 'text-gray-100'
                            }`}
                          >
                            {setting.name}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="span"
                            className={`${
                              checked ? 'text-indigo-300' : 'text-gray-300'
                            } block text-sm`}
                          >
                            {setting.description}
                          </RadioGroup.Description>
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
            <div className="flex-col mt-4 space-y-2">
              <span>
                {intl.formatMessage(messages.whatswrong)}{' '}
                <span className="label-required">*</span>
              </span>
              <Field
                as="textarea"
                name="message"
                id="message"
                className="h-28"
                placeholder={intl.formatMessage(messages.providedetail)}
              />
              {errors.message && touched.message && (
                <div className="error">{errors.message}</div>
              )}
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default CreateIssueModal;
