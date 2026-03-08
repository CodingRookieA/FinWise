import mongoose from 'mongoose'

const SourceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'fundamentals',       // What is a mutual fund, NAV, units etc.
        'canadian_accounts',  // RRSP, TFSA, FHSA, RESP, RRIF
        'strategy',           // Asset allocation, diversification, rebalancing
        'fees',               // MER, TER, DSC, fund series
        'tax',                // Distribution types, ACB, capital gains
      ],
    },
    // Track indexing status so you know which articles need re-embedding
    is_indexed: {
      type: Boolean,
      default: false,
    },
    last_indexed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export const Source = mongoose.model('Source', SourceSchema)