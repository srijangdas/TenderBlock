package icu.telepathystudios.puretender.controller.test;


import icu.telepathystudios.puretender.service.blockchain.FabricService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

    @Autowired
    private FabricService fabricService;

    @GetMapping("/assets")
    public String getAssets() {
        try {
            return fabricService.getAllAssets();
        } catch (Exception e) {
            return "Error retrieving assets: " + e.getMessage();
        }
    }

    @PostMapping("/asset")
    public String createAsset(@RequestParam String id, @RequestParam String color,
                              @RequestParam int size, @RequestParam String owner,
                              @RequestParam int value) {
        try {
            return fabricService.createAsset(id, color, size, owner, value);
        } catch (Exception e) {
            return "Error creating asset: " + e.getMessage();
        }
    }
}
