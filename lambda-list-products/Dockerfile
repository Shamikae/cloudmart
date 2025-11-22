FROM public.ecr.aws/lambda/nodejs:20 AS base

WORKDIR /var/task

COPY package*.json ./
RUN npm ci --omit=dev

COPY index.mjs ./

CMD ["index.handler"]
