package icu.telepathystudios.puretender.dto.bid;

public record BidProposalDownload(
        byte[] fileData,
        String fileName,
        String contentType
) {}