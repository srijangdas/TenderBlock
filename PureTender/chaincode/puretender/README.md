# PureTender integrity record chaincode

This Fabric contract stores a SHA-256 commitment for each tender and submitted bid. It does not store bid amounts, contractor details, proposal PDFs, or tender descriptions in world state.

The Spring service expects the deployed contract to expose `CreateRecord(recordId, recordType, parentId, payloadHash)` and `UpdateRecord(recordId, payloadHash)`. Query transactions `ReadRecord(recordId)` and `GetAllRecords()` are also available for verification.

The contract also retains `CreateAsset` and `GetAllAssets` for the existing sample blockchain controller. Build and deploy this chaincode to the channel configured by `fabric.channel`, using the chaincode ID configured by `fabric.chaincode`. The application currently defaults to the ID `basic`; the ID deployed on the network must match that property.
