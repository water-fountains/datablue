# datablue
Datablue is a tool for collecting and aggregating open data.
It is being developed in conjunction with [Proximap](//github.com/mmmatthew/proximap), a responsive web app for finding nearby public infrastructure, using drinking fountains as a showcase example. Check out [water-fountains.org](//water-fountains.org)
for more information on the overall project.

The project is open source under the GNU Affero General Public License, with a profit contribution agreement applying under restricted conditions. See [COPYING](/COPYING) for information.

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/aWaterMap/datablue-Aggregation)

## Vision
Datablue will consist in a collection of scripts and data structures for collecting and manipulating data, which can be executed on a schedule to generate an always up-to-date consolidated dataset.
![data flow](/docs/images/data-flow.png)

View the data processing concept [here](https://www.lucidchart.com/invitations/accept/59c350e2-310e-4279-8169-7044839b7307). See the [docs](/docs/components.md) for planned components.

# Up and running

## Install It
```
npm install
```

## Run It
#### Run in *development* mode:

```
npm run dev
```

#### Run in *production* mode:
warning: this assumes you have a private key and certificate for ssl encryption located at 

`/etc/letsencrypt/live/water-fountains.org/`

On the server, copy the environment file

`cp .envTEMPLATE .env`

and add to `.env` the following variable

`NODE_ENV=production`

Then run
```
npm run init_symlink_server
npm run compile
pm2 start build/main.js --name "datablue"
```



### Try It
* Point you're browser to [http://localhost:3000](http://localhost:3000)
* Invoke the example REST endpoint `curl http://localhost:3000/api/v1/examples`
   


# Contributing

Submit an issue for a feature request, architecture suggestion, or to discuss a modification you have made or would like to make. 

If you would like to contribute directly to the code, fork this repo and make a pull request.

To get ideas for how to contribute, check out the [docs](/docs) or look for *TODO* comments in the code.
