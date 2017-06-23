# Upstream
An Alexa skill that tells you what new TV shows are on the horizon

## Install Alexa Skill
Move to skill directory
```
cd skill
```

Install dependencies
```
npm install
```

Make a build directory
```
mkdir build
```

Bundle the app for upload to Alexa Skill Kit Portal

```
npm run compress
```
Upload the zipped file found at
```
./build/build.zip
```

## Built With

#### Web Scraper
- Node
- Phantom
- Cheerio

#### Database
- Firebase

#### Alexa Skill
- Node
- Moment
