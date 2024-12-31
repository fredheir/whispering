import { Ok, tryAsync } from '@epicenterhq/result';
import type { Settings } from '@repo/shared';
import Dexie from 'dexie';
import { toast } from '../../utils/toast';
import type { DbService } from './RecordingsService';
import { DbServiceErr } from './RecordingsService';
import type { Recording } from './types/Recordings';

const DB_NAME = 'RecordingDB';
const DB_VERSION = 3;

class RecordingsDatabase extends Dexie {
	recordings!: Dexie.Table<Recording, string>;

	constructor() {
		super(DB_NAME);

		// V1: Single recordings table
		this.version(1).stores({ recordings: '&id, title, timestamp' });

		// V2: Split into metadata and blobs
		this.version(2)
			.stores({
				recordings: null,
				recordingMetadata: '&id, title, timestamp',
				recordingBlobs: '&id',
			})
			.upgrade(async (tx) => {
				// Migrate data from recordings to split tables
				const oldRecordings = await tx.table<Recording>('recordings').toArray();

				// Create entries in both new tables
				const metadata = oldRecordings.map(
					({ blob, ...recording }) => recording,
				);
				const blobs = oldRecordings.map(({ id, blob }) => ({ id, blob }));

				await tx
					.table<Omit<Recording, 'blob'>>('recordingMetadata')
					.bulkAdd(metadata);
				await tx
					.table<{ id: string; blob: Blob | undefined }>('recordingBlobs')
					.bulkAdd(blobs);
			});

		// V3: Back to single recordings table
		this.version(3)
			.stores({
				recordings: '&id, title, [timestamp+id]',
				recordingMetadata: null,
				recordingBlobs: null,
			})
			.upgrade(async (tx) => {
				// Get data from both tables
				const metadata = await tx
					.table<Omit<Recording, 'blob'>>('recordingMetadata')
					.toArray();
				const blobs = await tx
					.table<{ id: string; blob: Blob | undefined }>('recordingBlobs')
					.toArray();

				// Combine and migrate the data
				await Promise.all(
					metadata.map((record) => {
						const blob = blobs.find((b) => b.id === record.id)?.blob;
						return tx.table<Recording>('recordings').add({
							...record,
							blob,
						});
					}),
				);
			});
	}
}

export function createRecordingsIndexedDbService(): DbService {
	let recordings = $state<Recording[]>([]);
	const db = new RecordingsDatabase();

	const syncDbToRecordingsState = async () => {
		const allRecordingsFromDbResult = await tryAsync({
			try: async () => {
				return await db.recordings.toArray();
			},
			mapErr: (error) =>
				DbServiceErr({
					title: 'Error getting recordings from Dexie',
					description: 'Please try again',
					error,
				}),
		});

		if (!allRecordingsFromDbResult.ok) {
			toast.error({
				title: 'Failed to initialize recordings',
				description:
					'Unable to load your recordings from the database. This could be due to browser storage issues or corrupted data.',
				action: {
					type: 'more-details',
					error: allRecordingsFromDbResult.error,
				},
			});
			return;
		}
		recordings = allRecordingsFromDbResult.data;
	};

	syncDbToRecordingsState();

	return {
		get recordings() {
			return recordings;
		},

		async getRecording(id: string) {
			return tryAsync({
				try: async () => {
					const recording = await db.recordings.get(id);
					return recording || null;
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error getting recording from Dexie',
						description: 'Please try again',
						error,
					}),
			});
		},

		async addRecording(recording: Recording) {
			const addRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.add(recording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error adding recording to Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!addRecordingResult.ok) return addRecordingResult;
			recordings.push(recording);
			return Ok(undefined);
		},

		async updateRecording(recording: Recording) {
			const updateRecordingResult = await tryAsync({
				try: async () => {
					await db.recordings.put(recording);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error updating recording in Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!updateRecordingResult.ok) return updateRecordingResult;
			recordings = recordings.map((r) =>
				r.id === recording.id ? recording : r,
			);
			return Ok(undefined);
		},

		async deleteRecording(recording: Recording) {
			const deleteRecordingByIdResult = await tryAsync({
				try: async () => {
					await db.recordings.delete(recording.id);
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recording from Dexie',
						description: 'Please try again',
						error,
					}),
			});
			if (!deleteRecordingByIdResult.ok) return deleteRecordingByIdResult;
			recordings = recordings.filter((r) => r.id !== recording.id);
			return Ok(undefined);
		},

		async deleteRecordings(recordingsToDelete: Recording[]) {
			const ids = recordingsToDelete.map((r) => r.id);
			return tryAsync({
				try: async () => {
					await db.transaction('rw', db.recordings, async () => {
						await db.recordings.bulkDelete(ids);
					});
				},
				mapErr: (error) =>
					DbServiceErr({
						title: 'Error deleting recordings from Dexie',
						description: 'Please try again',
						error,
					}),
			});
		},

		// Stub implementations for pipeline methods to satisfy the interface
		async addPipelineStep() {
			return Ok(undefined);
		},
		async updatePipelineStep() {
			return Ok(undefined);
		},
		async deletePipelineStep() {
			return Ok(undefined);
		},
		async reorderPipeline() {
			return Ok(undefined);
		},
		async addPipelineRun() {
			return Ok(undefined);
		},

		async cleanupExpiredRecordings({
			'database.recordingRetentionStrategy': recordingRetentionStrategy,
			'database.maxRecordingCount': maxRecordingCount,
		}: Settings) {
			switch (recordingRetentionStrategy) {
				case 'keep-forever': {
					return Ok(undefined);
				}
				case 'limit-count': {
					const count = await db.recordings.count();
					if (count === 0) return Ok(undefined);

					const maxCount = Number.parseInt(maxRecordingCount);

					if (count <= maxCount) return Ok(undefined);

					return tryAsync({
						try: async () => {
							await db.transaction('rw', db.recordings, async () => {
								// Get IDs of oldest recordings that exceed the limit
								const idsToDelete = await db.recordings
									.orderBy('timestamp')
									.limit(count - maxCount)
									.primaryKeys();

								await db.recordings.bulkDelete(idsToDelete);
							});
						},
						mapErr: (error) =>
							DbServiceErr({
								title: 'Unable to clean up old recordings',
								description: 'Some old recordings could not be deleted',
								error,
							}),
					});
				}
			}
		},
	};
}
