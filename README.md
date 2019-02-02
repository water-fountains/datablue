# datablue
Datablue is a tool for collecting and aggregating open data, written using NodeJS and Express.
It is being developed in conjunction with [Proximap](//github.com/mmmatthew/proximap), a responsive web app for finding nearby public infrastructure, using drinking fountains as a showcase example. Check out [water-fountains.org](//water-fountains.org)
for more information on the overall project.

The project is open source under the GNU Affero General Public License, with a profit contribution agreement applying under restricted conditions. See [COPYING](/COPYING) for information.

## Vision
Datablue will consist in a collection of scripts and data structures for collecting and manipulating data, which can be executed on a schedule to generate an always up-to-date consolidated dataset.

![data processing](https://www.lucidchart.com/publicSegments/view/fbd5eb93-ad45-4c2f-9502-17792052a63a/image.png)
View the data processing concept [here](https://www.lucidchart.com/invitations/accept/24f813e7-3d79-4de6-90bc-a3bfbe8d8cbf). See the [docs](/docs/components.md) for planned components.

# Running the project locally
1. Requirements (make sure these are up to date)
  - [NodeJS](https://nodejs.org) is a JavaScript runtime.
  - [Git](https://git-scm.com/) is a version control system.
2. Clone this repository to a local project directory `> git clone https://github.com/water-fountains/datablue.git -b develop`.
3. Open a command line in the local project directory
    - Install required node packages `> npm install`
    - Create a copy of the environment file `> cp .envTEMPLATE .env`
4. In the newly copied `.env` file, set the following variable:
    - `GOOGLE_API_KEY=[mykey]` get a Google Maps API key and set it in the place of `[mykey]`. This is optional but required in order to see Google Street View images.
5. Run it by running `npm run dev` in the local project directory.
6. Try it
   * Point you're browser to [http://localhost:3000](http://localhost:3000)
   * Invoke the example REST endpoint `curl http://localhost:3000/api/v1/fountains`

# Running the project in *production* mode:
warning: this assumes you have a private key `privkey.pem` and certificate `cert.pem` for ssl encryption located at 

`/etc/letsencrypt/live/water-fountains.org/`

If this isn't the case, modify the `init_symlink_server` script in `package.json`.

Then run
```
npm run init_symlink_server
npm run compile
pm2 start build/main.js --name "datablue"
```
Note: In production mode, the endpoint is available over https.
   

# Contributing

Submit an issue for a feature request, architecture suggestion, or to discuss a modification you have made or would like to make. 

If you would like to contribute directly to the code, fork this repo and make a pull request.

To get ideas for how to contribute, check out the repository issues.

To add a fountain property to be processed and made available by datablue, check this guide: [Guide: include a new fountain property (operator id) in the processing pipeline](https://github.com/water-fountains/datablue/wiki/Guide:-include-a-new-fountain-property-(operator-id)-in-the-processing-pipeline)
