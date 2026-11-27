import type { ImageAnnotation } from "@annotorious/react";
import Dexie, { type Table } from "dexie";
import type { CapturedPhoto } from "@/hooks/use-camera";
import type { LiveQuality } from "@/lib/image-quality";
import { logger } from "@/lib/logger";

const SESSION_KEY = "annotarama:photo-session";
const PENDING_DELETION_PREFIX = "annotarama:pending-photo-deletion:";
const CLOSE_GRACE_MS = 5_000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

export type PhotoDraftStatus = "saving" | "saved" | "error";

export type PhotoDraftStage = "review" | "annotating";

type PhotoDraft = CapturedPhoto & {
	id: string;
	stage: PhotoDraftStage;
	qualityAtCapture: LiveQuality;
	annotations: ImageAnnotation[];
	updatedAt: number;
};

type PendingDeletion = { id: string; queuedAt: number };

class PhotoDraftDatabase extends Dexie {
	drafts!: Table<PhotoDraft, string>;

	constructor() {
		super("annotarama-photo-drafts");
		this.version(1).stores({ drafts: "id, updatedAt" });
	}
}

const database = new PhotoDraftDatabase();
let currentSessionId: string | null = null;

const readSessionId = () => {
	try {
		return sessionStorage.getItem(SESSION_KEY);
	} catch {
		return null;
	}
};

const readPendingDeletions = (): PendingDeletion[] => {
	try {
		return Array.from({ length: localStorage.length }, (_, index) =>
			localStorage.key(index),
		)
			.filter(
				(key): key is string =>
					key?.startsWith(PENDING_DELETION_PREFIX) === true,
			)
			.flatMap((key) => {
				const id = key.slice(PENDING_DELETION_PREFIX.length);
				const value = localStorage.getItem(key);
				const queuedAt = Number(value);
				return id && value && Number.isFinite(queuedAt)
					? [{ id, queuedAt }]
					: [];
			});
	} catch {
		return [];
	}
};

const removePendingDeletion = ({ id, queuedAt }: PendingDeletion) => {
	try {
		const key = `${PENDING_DELETION_PREFIX}${id}`;
		if (Number(localStorage.getItem(key)) === queuedAt) {
			localStorage.removeItem(key);
		}
	} catch (error) {
		logger.warn("Could not clear photo draft cleanup marker", error);
	}
};

export const getOrCreatePhotoSessionId = () => {
	if (currentSessionId) return currentSessionId;

	try {
		const navigation = performance.getEntriesByType("navigation")[0] as
			| PerformanceNavigationTiming
			| undefined;
		const navigationType = navigation?.type;
		const previousId = readSessionId();
		const isSameTabNavigation =
			navigationType === "reload" || navigationType === "back_forward";
		const id =
			isSameTabNavigation && previousId ? previousId : crypto.randomUUID();
		sessionStorage.setItem(SESSION_KEY, id);
		currentSessionId = id;
		return id;
	} catch (error) {
		logger.warn("Could not create a tab-scoped photo session", error);
		return null;
	}
};

export const loadPhotoDraft = (id: string) => database.drafts.get(id);

export const savePhotoDraft = async (
	id: string,
	photo: CapturedPhoto,
	qualityAtCapture: LiveQuality,
) => {
	await database.drafts.put({
		...photo,
		id,
		stage: "review",
		qualityAtCapture,
		annotations: [],
		updatedAt: Date.now(),
	});
};

export const setPhotoDraftStage = async (
	id: string,
	stage: PhotoDraftStage,
) => {
	const updated = await database.drafts.update(id, {
		stage,
		updatedAt: Date.now(),
	});
	if (updated === 0) throw new Error("Photo draft does not exist");
};

export const savePhotoAnnotations = async (
	id: string,
	annotations: ImageAnnotation[],
) => {
	await database.transaction("rw", database.drafts, async () => {
		const current = await database.drafts.get(id);
		if (!current) throw new Error("Photo draft does not exist");
		await database.drafts.put({
			...current,
			annotations,
			updatedAt: Date.now(),
		});
	});
};

export const deletePhotoDraft = (id: string) => database.drafts.delete(id);

export const startPhotoDraftCleanup = () => {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const cleanup = async () => {
		const activeId = readSessionId();
		const now = Date.now();
		const pending = readPendingDeletions();
		const expired = pending.filter(
			({ id, queuedAt }) => id !== activeId && now - queuedAt >= CLOSE_GRACE_MS,
		);
		const expiredIds = new Set(expired.map(({ id }) => id));

		try {
			await database.transaction("rw", database.drafts, async () => {
				await database.drafts.bulkDelete([...expiredIds]);
				await database.drafts
					.where("updatedAt")
					.below(now - MAX_AGE_MS)
					.and((draft) => draft.id !== activeId)
					.delete();
			});
		} catch (error) {
			logger.warn("Could not clean up closed-tab photo data", error);
			return;
		}

		for (const item of expired) removePendingDeletion(item);
		for (const item of pending) {
			if (item.id === activeId) removePendingDeletion(item);
		}

		const remaining = readPendingDeletions().filter(
			({ id }) => id !== activeId,
		);
		const nextCleanupAt = remaining
			.map(({ queuedAt }) => queuedAt + CLOSE_GRACE_MS)
			.filter((cleanupAt) => cleanupAt > now)
			.sort((left, right) => left - right)[0];
		if (nextCleanupAt !== undefined) {
			timer = setTimeout(cleanup, nextCleanupAt - now);
		}
	};

	const queueCleanup = () => {
		const id = readSessionId();
		if (!id) return;
		try {
			localStorage.setItem(
				`${PENDING_DELETION_PREFIX}${id}`,
				String(Date.now()),
			);
		} catch (error) {
			logger.warn("Could not queue photo draft cleanup", error);
		}
	};

	const handlePageShow = () => {
		if (timer) clearTimeout(timer);
		void cleanup();
	};

	window.addEventListener("pagehide", queueCleanup);
	window.addEventListener("pageshow", handlePageShow);
	void cleanup();

	return () => {
		if (timer) clearTimeout(timer);
		window.removeEventListener("pagehide", queueCleanup);
		window.removeEventListener("pageshow", handlePageShow);
	};
};
