import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostModel } from '../models/post.model';

import { BaseRepository } from './base-repository';

@Injectable()
export class BasePostRepository extends BaseRepository<PostModel> {
    constructor(
        @InjectRepository(PostModel)
        postRepository: Repository<PostModel>,
    ) {
        super(postRepository);
    }
}
