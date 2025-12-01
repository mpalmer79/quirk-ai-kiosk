# Use a Python base image that is slim for smaller final image size
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# 1. Install dependencies
# Copy requirements.txt and install them first to leverage Docker layer caching
# If requirements.txt doesn't change, this layer won't be rebuilt.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy application code
# Copy the serving logic and model files
# Note: For production, only copy the necessary predictor/model files.
COPY ./predictor /app/predictor
COPY ./models /app/models

# 3. Expose the port where the prediction service will run
# We assume the internal prediction service (e.g., Flask/FastAPI) runs on port 8001
EXPOSE 8001

# 4. Define the command to run the service
# This command starts the Python prediction server
# Replace 'predictor.server' with the actual entry point file/module name if different
CMD ["python", "predictor/server.py"]
