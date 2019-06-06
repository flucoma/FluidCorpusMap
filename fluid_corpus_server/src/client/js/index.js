import {runScatterPlot} from './scatterplot/app.js'
import {runMultiSlider} from './multislider/app.js'
import {runDrumMachine} from './drummachine/app.js'


let url = window.location.pathname;
let filename = url.substring(url.lastIndexOf('/')+1).split(".")[0];
if(filename=="scatterplot")runScatterPlot();
if(filename=="multislider")runMultiSlider();
if(filename=="drummachine")runDrumMachine();
