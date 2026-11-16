import { createReview, deleteMyReview, deleteReviewById, listReviews } from '../services/reviews.service.js';

export async function getReviews(req, res) {
  res.json(await listReviews(req.validated.params.slug, req.user));
}

export async function postReview(req, res) {
  res.status(201).json(await createReview(req.user, req.validated.params.slug, req.validated.body));
}

export async function deleteMine(req, res) {
  res.json(await deleteMyReview(req.user, req.validated.params.slug));
}

export async function deleteReview(req, res) {
  await deleteReviewById(req.validated.params.id);
  res.status(204).end();
}
