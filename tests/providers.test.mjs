import {test} from 'node:test';
import assert from 'node:assert/strict';
import {archiveEpisodes,classify,safeURL,licenseURL,searchArchive} from '../dist/providers.js';
const license='https://creativecommons.org/licenses/by/3.0/';
const file=(name,height,length,original)=>({name,height:String(height),length:String(length),size:'50000000',original});
test('film quality labels use actual pixels, not misleading filenames; trailers excluded',()=>{
 const out=archiveEpisodes({metadata:{licenseurl:license},files:[file('movie_1080p.mp4',360,720),file('movie.webm',800,720),file('trailer.mp4',1080,50)]},{ref:'movie',title:'Movie',kind:'film'});
 assert.equal(out.episodes.length,1);assert.deepEqual(out.episodes[0].sources.map(s=>s.label),['800p','360p']);
});
test('episode encodings stay together and numeric episode ordering is preserved',()=>{
 const out=archiveEpisodes({metadata:{licenseurl:license},files:[file('Episode 10.mp4',720,1200),file('Episode 2.mp4',720,1200),file('Episode 2_512kb.mp4',240,1200,'Episode 2.mp4')]},{ref:'show',title:'Show',kind:'series'});
 assert.equal(out.episodes.length,2);assert.equal(out.episodes[0].id,'Episode 2');assert.equal(out.episodes[0].sources.length,2);assert.equal(out.episodes[1].id,'Episode 10');
});
test('unsafe links and unavailable licenses cannot enter player',()=>{
 assert.equal(safeURL('javascript:alert(1)'), '');assert.equal(safeURL('https://archive.org.evil.test/a',['archive.org']),'');assert.equal(licenseURL('https://other.test/licenses/by/3.0/'),'');
 assert.throws(()=>archiveEpisodes({metadata:{},files:[]},{kind:'film'}),/лицензию/);
 assert.throws(()=>archiveEpisodes({is_dark:true,metadata:{licenseurl:license},files:[]},{kind:'film'}),/ограничил/);
});
test('classification ignores personal favorite collection names',()=>{
 assert.equal(classify({title:'A silent movie',collection:['feature_films','fav-cartoon_series_enthusiast']}),'film');
 assert.equal(classify({title:'A TV episode',collection:['classic_tv']}),'series');assert.equal(classify({title:'Popeye cartoons'}),'animatedSeries');
});
test('archive search preserves license filter and omits unsupported score sort',async()=>{
 const original=globalThis.fetch;let url;
 globalThis.fetch=async u=>{url=new URL(u);return {ok:true,json:async()=>({response:{numFound:0,docs:[]}})}};
 try{await searchArchive({q:'Nosferatu'});assert.equal(url.searchParams.has('sort[]'),false);assert.match(url.searchParams.get('q'),/licenseurl/);assert.match(url.searchParams.get('q'),/title:/)}finally{globalThis.fetch=original}
});
