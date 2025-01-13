import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  venue: String,
  artist: String,
  concertDate: Date,
  concertTime: { type: String, required: true, unique: true },
  linkToBuyTickets: String,  
});

const Show = mongoose.model('Show', showSchema);

export default Show;