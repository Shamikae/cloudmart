# lambda-list-products/Dockerfile
FROM public.ecr.aws/lambda/nodejs:20

WORKDIR /var/task

COPY package*.json ./
RUN npm ci --omit=dev

# Copy the handler
COPY index.js ./index.js

# Explicitly set handler env so Lambda picks it up even if config Handler is null
ENV AWS_LAMBDA_FUNCTION_HANDLER=index.handler
ENV _HANDLER=index.handler

CMD ["index.handler"]
