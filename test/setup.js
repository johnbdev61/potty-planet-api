/* eslint-disable semi */
const { expect } = require('chai')
const supertest = require('supertest')

global.expect = expect
global.supertest = supertest
process.env.TZ = 'UTC'
