package com.example.catalogservice.config;

import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Song;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true);

        modelMapper.typeMap(Song.class, SongResponse.class).setPostConverter(context -> {
            Song source = context.getSource();
            SongResponse destination = context.getDestination();
            if (source != null && destination != null && source.getAlbum() != null) {
                destination.setAlbumId(source.getAlbum().getId());
                destination.setAlbumTitle(source.getAlbum().getTitle());
            }
            return destination;
        });

        return modelMapper;
    }
}
