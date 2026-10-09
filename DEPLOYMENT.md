# Google Cloud Deployment Guide

This repository includes a multi-stage production Docker container configured for **Google Cloud Run**, **Google Cloud Build**, and **Google Kubernetes Engine (GKE)**.

---

## 1. Quick Deploy to Google Cloud Run (Recommended)

Google Cloud Run automatically scales from 0 to N instances, handles HTTPS certificates, and routes traffic effortlessly.

### Option A: One-Command Build & Deploy using Cloud Build
Run the following from the root of your project:

```bash
# 1. Authenticate and select your Google Cloud project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build and deploy directly to Cloud Run
gcloud run deploy apodex-ai-chat \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

### Option B: Build Docker Image Locally and Deploy

```bash
# 1. Authenticate Docker with Google Container Registry or Artifact Registry
gcloud auth configure-docker

# 2. Build the Docker container image
docker build -t gcr.io/YOUR_PROJECT_ID/apodex-ai-chat:latest .

# 3. Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/apodex-ai-chat:latest

# 4. Deploy the image to Cloud Run
gcloud run deploy apodex-ai-chat \
  --image gcr.io/YOUR_PROJECT_ID/apodex-ai-chat:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## 2. Automated CI/CD with Google Cloud Build

A complete `cloudbuild.yaml` file is provided in this repository.

To trigger a build and deployment pipeline:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

You can also connect your GitHub repository in the [Google Cloud Console Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers) to automatically build and deploy on every `git push` to `main`.

---

## 3. Environment Variables & Secrets

You can pass environment variables securely via Google Secret Manager or Cloud Run flags:

```bash
gcloud run services update apodex-ai-chat \
  --region us-central1 \
  --set-env-vars="OPENROUTER_API_KEY=your_key_here,NEMOTRON_API_KEY=your_key_here"
```

---

## 4. Google Kubernetes Engine (GKE) Deployment

If deploying into a Kubernetes cluster on GCP:

```bash
# Replace PROJECT_ID with your Google Cloud Project ID in k8s-deployment.yaml, then apply:
kubectl apply -f k8s-deployment.yaml
```

---

## 5. Container Specifications

- **Base Image**: `node:22-alpine` (builder) and `node:22-alpine` (production runtime)
- **Included Utilities**: Node.js 22 runtime, Python 3 runtime (for in-browser & server Python execution)
- **Security**: Runs under non-root `node` user following CIS benchmarks
- **Healthcheck**: Configured to query `/api/health`
- **Default Port**: `8080` (automatically set by Cloud Run)
